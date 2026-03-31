import { describe, expect, test } from "bun:test";
import { executeToolCall } from "../../src/core/tools/broker";
import { buildToolRegistry } from "../../src/core/tools/registry";
import { toToolResultSuccess } from "../../src/core/tools/result";
import type { UnifiedTool } from "../../src/core/types";
import { FakeToolProvider } from "../helpers/fakeToolProvider";

describe("tool broker", () => {
	test("returns success envelope for valid args", async () => {
		const tool: UnifiedTool = {
			descriptor: {
				name: "search_web",
				description: "Search web",
				inputSchemaJson: {},
				provider: "local",
			},
			async execute(args) {
				return toToolResultSuccess(args);
			},
		};

		const registry = await buildToolRegistry([new FakeToolProvider([tool])]);
		const result = await executeToolCall({
			registry,
			policies: [],
			toolName: "search_web",
			args: { query: "bun test" },
			context: {},
		});

		expect(result.ok).toBe(true);
	});

	test("returns INVALID_TOOL_ARGUMENTS for non-object args", async () => {
		const tool: UnifiedTool = {
			descriptor: {
				name: "search_web",
				description: "Search web",
				inputSchemaJson: {},
				provider: "local",
			},
			async execute(args) {
				return toToolResultSuccess(args);
			},
		};

		const registry = await buildToolRegistry([new FakeToolProvider([tool])]);
		const result = await executeToolCall({
			registry,
			policies: [],
			toolName: "search_web",
			args: "query=bun",
			context: {},
		});

		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.code).toBe("INVALID_TOOL_ARGUMENTS");
		}
	});

	test("returns TOOL_NOT_FOUND for unknown tool", async () => {
		const registry = await buildToolRegistry([]);
		const result = await executeToolCall({
			registry,
			policies: [],
			toolName: "missing_tool",
			args: {},
			context: {},
		});

		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.code).toBe("TOOL_NOT_FOUND");
		}
	});

	test("returns TOOL_EXECUTION_ERROR for invalid tool result envelope", async () => {
		const tool = {
			descriptor: {
				name: "search_web",
				description: "Search web",
				inputSchemaJson: {},
				provider: "local",
			},
			async execute() {
				return {
					ok: false,
				};
			},
		} as unknown as UnifiedTool;

		const registry = await buildToolRegistry([new FakeToolProvider([tool])]);
		const result = await executeToolCall({
			registry,
			policies: [],
			toolName: "search_web",
			args: { query: "bun" },
			context: {},
		});

		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.code).toBe("TOOL_EXECUTION_ERROR");
		}
	});
});
