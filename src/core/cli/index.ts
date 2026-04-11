import { appendToolHistoryPair } from "../session";
import { toToolResultFailure, toToolResultSuccess } from "../tools/result";
import type { SessionMessage } from "../types/model";
import type { CliInvocation } from "./args";
import { resolveReplCommand } from "./commands";
import { runRepl } from "./repl";

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

export function createCliPromptHandler(input: {
	isReplMode: boolean;
	history: SessionMessage[];
	runPrompt: (
		prompt: string,
		history: SessionMessage[],
	) => Promise<{ output: string; history: SessionMessage[] }>;
	skills?: CliSkillsAdapter;
}): (prompt: string) => Promise<string> {
	return async function handlePrompt(prompt: string): Promise<string> {
		if (!input.isReplMode) {
			const result = await input.runPrompt(prompt, input.history);
			input.history.splice(0, input.history.length, ...result.history);
			return result.output;
		}

		const command = resolveReplCommand({
			raw: prompt,
			availableSkillNames: input.skills?.listSkillNames() ?? [],
		});

		if (command.type === "skills_list") {
			const summaries = input.skills?.listSkillSummaries() ?? [];
			if (summaries.length === 0) {
				return "No skills found.";
			}

			return summaries
				.map((skill) => `- ${skill.name}: ${skill.description}`)
				.join("\n");
		}

		if (command.type === "skill_activate") {
			const activation = await input.skills?.activateByName(command.name);
			if (activation === undefined) {
				return "Skills are not enabled.";
			}

			const toolResult = activation.ok
				? toToolResultSuccess(activation.data)
				: toToolResultFailure("BUSINESS_RULE_VIOLATION", activation.message);

			appendToolHistoryPair({
				history: input.history,
				toolName: "activate_skill",
				args: { name: command.name },
				result: toolResult,
			});

			if (!activation.ok) {
				return activation.message;
			}

			return `Activated skill: ${command.name}`;
		}

		if (command.type === "unknown_slash") {
			if (command.suggestions.length === 0) {
				return `Unknown slash command: ${command.value}`;
			}

			return `Unknown slash command: ${command.value}\nDid you mean: ${command.suggestions.join(", ")}`;
		}

		if (command.type !== "prompt") {
			return "";
		}

		const result = await input.runPrompt(command.value, input.history);
		input.history.splice(0, input.history.length, ...result.history);
		return result.output;
	};
}

export async function runCli(input: {
	args: CliInvocation;
	runPrompt: (
		prompt: string,
		history: SessionMessage[],
	) => Promise<{ output: string; history: SessionMessage[] }>;
	skills?: CliSkillsAdapter;
}): Promise<void> {
	const history: SessionMessage[] = [];
	const handlePrompt = createCliPromptHandler({
		isReplMode: input.args.command === "repl",
		history,
		runPrompt: input.runPrompt,
		skills: input.skills,
	});

	if (input.args.command === "run") {
		const output = await handlePrompt(input.args.prompt);
		process.stdout.write(`${output}\n`);
		return;
	}

	await runRepl({
		onPrompt: handlePrompt,
		async onReset(): Promise<void> {
			history.splice(0, history.length);
		},
		onHelp(): string {
			return [
				"Commands:",
				"  /help  Show available commands",
				"  /reset Clear session history",
				"  /skills  List available skills",
				"  /skill <name> Activate a skill",
				"  /<skill-name> Activate via alias",
				"  /exit, :q  Exit the REPL",
			].join("\n");
		},
	});
}
