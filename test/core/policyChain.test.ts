import { describe, expect, test } from "bun:test";
import { executeToolCall } from "../../src/core/tools/broker";
import { buildToolRegistry } from "../../src/core/tools/registry";
import { toToolResultSuccess } from "../../src/core/tools/result";
import type { ToolPolicy, UnifiedTool } from "../../src/core/types";
import { FakePolicy } from "../helpers/fakePolicy";
import { FakeToolProvider } from "../helpers/fakeToolProvider";

describe("policy chain", () => {
	test("short-circuits with BUSINESS_RULE_VIOLATION", async () => {
		let executionCount = 0;

		const tool: UnifiedTool = {
			descriptor: {
				name: "delete_data",
				description: "Delete sensitive data",
				inputSchemaJson: {},
				provider: "local",
			},
			async execute() {
				executionCount += 1;
				return toToolResultSuccess({ ok: true });
			},
		};

		const registry = await buildToolRegistry([new FakeToolProvider([tool])]);
		const result = await executeToolCall({
			registry,
			policies: [new FakePolicy(["delete_data"])],
			toolName: "delete_data",
			args: { id: "123" },
			context: {},
		});

		expect(result.ok).toBe(false);
		expect(executionCount).toBe(0);

		if (!result.ok) {
			expect(result.code).toBe("BUSINESS_RULE_VIOLATION");
		}
	});

	test("returns TOOL_EXECUTION_ERROR for invalid policy decision", async () => {
		const tool: UnifiedTool = {
			descriptor: {
				name: "delete_data",
				description: "Delete sensitive data",
				inputSchemaJson: {},
				provider: "local",
			},
			async execute() {
				return toToolResultSuccess({ ok: true });
			},
		};

		const invalidPolicy = {
			async evaluate() {
				return {
					allow: false,
				};
			},
		} as unknown as ToolPolicy;

		const registry = await buildToolRegistry([new FakeToolProvider([tool])]);
		const result = await executeToolCall({
			registry,
			policies: [invalidPolicy],
			toolName: "delete_data",
			args: { id: "123" },
			context: {},
		});

		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.code).toBe("TOOL_EXECUTION_ERROR");
		}
	});
});
