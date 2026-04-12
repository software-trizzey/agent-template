import { appendToolHistoryPair } from "../../session";
import { toToolResultFailure, toToolResultSuccess } from "../../tools/result";
import type { ActivityEvent } from "../../types/activity";
import type { SessionMessage } from "../../types/model";
import { formatActivityEvent } from "../output";
import { formatReplHelpLines } from "./command-catalog";
import { type ReplResolvedCommand, resolveReplCommand } from "./commands";
import {
	formatModelListLines,
	type ReplModelSummary,
	toListedModels,
} from "./model-list";
import { reduceReplState } from "./reducer";
import { createInitialReplUiState, type ReplEvent } from "./types";
import type { ReplRendererPort } from "./ui/port";

type CliSkillsAdapter = {
	listSkillNames: () => string[];
	listSkillSummaries: () => Array<{ name: string; description: string }>;
	activateByName: (name: string) => Promise<
		| {
				ok: true;
				data: unknown;
		  }
		| {
				ok: false;
				message: string;
		  }
	>;
};

type CliModelsAdapter = {
	listModels: () => ReplModelSummary[];
};

export type ReplController = {
	start: () => void;
	onActivity: (event: ActivityEvent) => void;
	shutdown: () => void;
	isRunning: () => boolean;
	waitForStop: () => Promise<void>;
};

type ReplShutdownPolicy = {
	shutdown: () => void;
	waitForStop: () => Promise<void>;
};

function toUnknownSlashMessage(input: {
	value: string;
	suggestions: string[];
}): string {
	if (input.suggestions.length === 0) {
		return `Unknown slash command: ${input.value}`;
	}

	return `Unknown slash command: ${input.value}\nDid you mean: ${input.suggestions.join(", ")}`;
}

function dispatchHelpRows(dispatch: (event: ReplEvent) => void): void {
	for (const line of formatReplHelpLines()) {
		dispatch({ type: "system_message", text: line });
	}
}

function resetSession(input: {
	history: SessionMessage[];
	dispatch: (event: ReplEvent) => void;
}): void {
	input.history.splice(0, input.history.length);
	input.dispatch({ type: "session_reset" });
	input.dispatch({ type: "system_message", text: "Session reset." });
}

function dispatchSkillsList(input: {
	skills?: CliSkillsAdapter;
	dispatch: (event: ReplEvent) => void;
}): void {
	const summaries = input.skills?.listSkillSummaries() ?? [];
	if (summaries.length === 0) {
		input.dispatch({ type: "system_message", text: "No skills found." });
		return;
	}

	for (const summary of summaries) {
		input.dispatch({
			type: "system_message",
			text: `- ${summary.name}: ${summary.description}`,
		});
	}
}

function dispatchModelsList(input: {
	models?: CliModelsAdapter;
	currentModelSpec?: string;
	dispatch: (event: ReplEvent) => void;
}): void {
	const listedModels = toListedModels({
		models: input.models?.listModels() ?? [],
		currentModelSpec: input.currentModelSpec,
	});

	if (listedModels.length === 0) {
		for (const line of formatModelListLines(listedModels)) {
			input.dispatch({ type: "system_message", text: line });
		}
		return;
	}

	input.dispatch({ type: "models_listed", models: listedModels });
}

async function activateSkill(input: {
	skills?: CliSkillsAdapter;
	history: SessionMessage[];
	name: string;
	dispatch: (event: ReplEvent) => void;
}): Promise<void> {
	const activation = await input.skills?.activateByName(input.name);
	if (activation === undefined) {
		input.dispatch({
			type: "prompt_failed",
			message: "Skills are not enabled.",
		});
		return;
	}

	const toolResult = activation.ok
		? toToolResultSuccess(activation.data)
		: toToolResultFailure("BUSINESS_RULE_VIOLATION", activation.message);

	appendToolHistoryPair({
		history: input.history,
		toolName: "activate_skill",
		args: { name: input.name },
		result: toolResult,
	});

	input.dispatch({
		type: "system_message",
		text: activation.ok ? `Activated skill: ${input.name}` : activation.message,
	});
}

async function executePrompt(input: {
	value: string;
	history: SessionMessage[];
	runPrompt: (
		prompt: string,
		history: SessionMessage[],
	) => Promise<{ output: string; history: SessionMessage[] }>;
	dispatch: (event: ReplEvent) => void;
}): Promise<void> {
	input.dispatch({ type: "prompt_submitted", prompt: input.value });
	input.dispatch({ type: "prompt_started" });

	try {
		const result = await input.runPrompt(input.value, input.history);
		input.history.splice(0, input.history.length, ...result.history);
		input.dispatch({ type: "prompt_succeeded", output: result.output });
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		input.dispatch({ type: "prompt_failed", message });
	}
}

function createReplShutdownPolicy(input: {
	isRunning: () => boolean;
	requestExit: () => void;
	stopRenderer: () => void;
}): ReplShutdownPolicy {
	let resolveStopped: (() => void) | null = null;
	const stopped = new Promise<void>((resolve) => {
		resolveStopped = resolve;
	});

	const shutdown = (): void => {
		if (!input.isRunning()) {
			return;
		}

		input.requestExit();
		input.stopRenderer();
		resolveStopped?.();
		resolveStopped = null;
	};

	return {
		shutdown,
		waitForStop() {
			return stopped;
		},
	};
}

export function createReplController(input: {
	renderer: ReplRendererPort;
	history: SessionMessage[];
	runPrompt: (
		prompt: string,
		history: SessionMessage[],
	) => Promise<{ output: string; history: SessionMessage[] }>;
	skills?: CliSkillsAdapter;
	models?: CliModelsAdapter;
	currentModelSpec?: string;
}): ReplController {
	let state = createInitialReplUiState();

	const dispatch = (event: ReplEvent): void => {
		state = reduceReplState(state, event);
		input.renderer.render(state);
	};

	const shutdownPolicy = createReplShutdownPolicy({
		isRunning() {
			return state.isRunning;
		},
		requestExit() {
			dispatch({ type: "exit_requested" });
		},
		stopRenderer() {
			input.renderer.stop();
		},
	});

	const handleCommand = async (command: ReplResolvedCommand): Promise<void> => {
		if (command.type === "help") {
			dispatchHelpRows(dispatch);
			return;
		}

		if (command.type === "reset") {
			resetSession({
				history: input.history,
				dispatch,
			});
			return;
		}

		if (command.type === "exit") {
			shutdownPolicy.shutdown();
			return;
		}

		if (command.type === "skills_list") {
			dispatchSkillsList({
				skills: input.skills,
				dispatch,
			});
			return;
		}

		if (command.type === "models_list") {
			dispatchModelsList({
				models: input.models,
				currentModelSpec: input.currentModelSpec,
				dispatch,
			});
			return;
		}

		if (command.type === "skill_activate") {
			await activateSkill({
				skills: input.skills,
				history: input.history,
				name: command.name,
				dispatch,
			});
			return;
		}

		if (command.type === "unknown_slash") {
			dispatch({
				type: "prompt_failed",
				message: toUnknownSlashMessage({
					value: command.value,
					suggestions: command.suggestions,
				}),
			});
			return;
		}

		await executePrompt({
			value: command.value,
			history: input.history,
			runPrompt: input.runPrompt,
			dispatch,
		});
	};

	const submit = async (raw: string): Promise<void> => {
		const value = raw.trim();
		if (value.length === 0 || state.isBusy || !state.isRunning) {
			return;
		}

		const command = resolveReplCommand({
			raw: value,
			availableSkillNames: input.skills?.listSkillNames() ?? [],
		});

		await handleCommand(command);
	};

	const onSubmit = (raw: string): void => {
		void submit(raw);
	};

	const onActivity = (event: ActivityEvent): void => {
		dispatch({
			type: "activity_received",
			event,
			text: formatActivityEvent(event),
		});
	};

	return {
		start() {
			input.renderer.start(state, {
				onSubmit,
				onExit: shutdownPolicy.shutdown,
			});
		},
		onActivity,
		shutdown: shutdownPolicy.shutdown,
		isRunning() {
			return state.isRunning;
		},
		waitForStop() {
			return shutdownPolicy.waitForStop();
		},
	};
}
