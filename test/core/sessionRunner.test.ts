import { describe, expect, test } from "bun:test";
import { createSessionRunner } from "../../src/core/session";
import { buildToolRegistry } from "../../src/core/tools/registry";
import { toToolResultSuccess } from "../../src/core/tools/result";
import type {
	ActivityEvent,
	RuntimeConfig,
	UnifiedTool,
} from "../../src/core/types";
import { FakeModelAdapter } from "../helpers/fakeModelAdapter";
import { FakeToolProvider } from "../helpers/fakeToolProvider";

describe("session runner", () => {
	test("returns assistant output without tools", async () => {
		const model = new FakeModelAdapter([
			{
				assistantText: "Done.",
				toolCall: null,
			},
		]);

		const registry = await buildToolRegistry([]);
		const events: ActivityEvent[] = [];
		const runtime: RuntimeConfig = {
			model: "test-model",
			maxTurns: 3,
			onActivity(event) {
				events.push(event);
			},
		};

		const runner = createSessionRunner({
			model,
			registry,
			policies: [],
			runtime,
		});

		const result = await runner.run({
			instructions: "You are helpful.",
			userText: "Hello",
			context: {},
			history: [],
		});

		expect(result.finalAssistantMessage).toBe("Done.");
		expect(result.terminationReason).toBe("assistant_output");
		expect(events.some((event) => event.type === "tool_started")).toBe(false);
	});

	test("returns max-turn fallback when no assistant text is produced", async () => {
		const tool: UnifiedTool = {
			descriptor: {
				name: "search_web",
				description: "Searches web",
				inputSchemaJson: {},
				provider: "local",
			},
			async execute() {
				return toToolResultSuccess({ ok: true });
			},
		};

		const model = new FakeModelAdapter([
			{
				assistantText: null,
				toolCall: { name: "search_web", args: { query: "a" } },
			},
			{
				assistantText: null,
				toolCall: { name: "search_web", args: { query: "b" } },
			},
		]);

		const registry = await buildToolRegistry([new FakeToolProvider([tool])]);
		const events: ActivityEvent[] = [];
		const runtime: RuntimeConfig = {
			model: "test-model",
			maxTurns: 2,
			onActivity(event) {
				events.push(event);
			},
		};

		const runner = createSessionRunner({
			model,
			registry,
			policies: [],
			runtime,
		});

		const result = await runner.run({
			instructions: "You are helpful.",
			userText: "Run search",
			context: {},
			history: [],
		});

		expect(result.finalAssistantMessage).toBe(
			"Unable to complete request within max turns.",
		);
		expect(result.terminationReason).toBe("max_turns");
		expect(events.some((event) => event.type === "tool_started")).toBe(true);
	});
});
