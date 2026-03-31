import { describe, expect, test } from "bun:test";
import { createSessionRunner } from "../../src/core/session";
import { buildToolRegistry } from "../../src/core/tools/registry";
import { toToolResultSuccess } from "../../src/core/tools/result";
import type {
	ActivityEvent,
	ModelTurn,
	RuntimeConfig,
	ToolFailureCode,
	UnifiedTool,
} from "../../src/core/types";
import { FakeModelAdapter } from "../helpers/fakeModelAdapter";
import { FakePolicy } from "../helpers/fakePolicy";
import { FakeToolProvider } from "../helpers/fakeToolProvider";

type EvalScenario = {
	turns: ModelTurn[];
	maxTurns: number;
	expected: {
		finalAssistantMessage: string;
		containsFailureCode: ToolFailureCode;
	};
};

async function loadScenario(fileName: string): Promise<EvalScenario> {
	const file = Bun.file(new URL(`./scenarios/${fileName}`, import.meta.url));
	return (await file.json()) as EvalScenario;
}

function createDefaultTools(): UnifiedTool[] {
	return [
		{
			descriptor: {
				name: "search_web",
				description: "Searches the web",
				inputSchemaJson: {},
				provider: "local",
			},
			async execute(args) {
				return toToolResultSuccess(args);
			},
		},
		{
			descriptor: {
				name: "delete_data",
				description: "Deletes data",
				inputSchemaJson: {},
				provider: "local",
			},
			async execute(args) {
				return toToolResultSuccess(args);
			},
		},
	];
}

async function runScenario(fileName: string) {
	const scenario = await loadScenario(fileName);
	const model = new FakeModelAdapter(scenario.turns);

	const registry = await buildToolRegistry([
		new FakeToolProvider(createDefaultTools()),
	]);
	const events: ActivityEvent[] = [];
	const runtime: RuntimeConfig = {
		model: "test-model",
		maxTurns: scenario.maxTurns,
		onActivity(event) {
			events.push(event);
		},
	};

	const runner = createSessionRunner({
		model,
		registry,
		policies: [new FakePolicy(["delete_data"])],
		runtime,
	});

	const result = await runner.run({
		instructions: "You are helpful.",
		userText: "run scenario",
		context: {},
		history: [],
	});

	const hasExpectedFailure = events.some((event) => {
		if (event.type !== "tool_finished") {
			return false;
		}

		if (scenario.expected.containsFailureCode === "BUSINESS_RULE_VIOLATION") {
			return (
				event.toolName === "delete_data" &&
				event.ok === false &&
				event.code === "BUSINESS_RULE_VIOLATION"
			);
		}

		if (scenario.expected.containsFailureCode === "INVALID_TOOL_ARGUMENTS") {
			return (
				event.toolName === "search_web" &&
				event.ok === false &&
				event.code === "INVALID_TOOL_ARGUMENTS"
			);
		}

		return false;
	});

	expect(hasExpectedFailure).toBe(true);
	expect(result.finalAssistantMessage).toBe(
		scenario.expected.finalAssistantMessage,
	);
}

describe("scenario evals", () => {
	test("policy block scenario", async () => {
		await runScenario("tool-policy-block.json");
	});

	test("invalid args scenario", async () => {
		await runScenario("invalid-tool-args.json");
	});
});
