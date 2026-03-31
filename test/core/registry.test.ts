import { describe, expect, test } from "bun:test";
import { buildToolRegistry } from "../../src/core/tools/registry";
import { toToolResultSuccess } from "../../src/core/tools/result";
import type { UnifiedTool } from "../../src/core/types";
import { FakeToolProvider } from "../helpers/fakeToolProvider";

describe("tool registry", () => {
	test("throws on duplicate tool names", async () => {
		const first: UnifiedTool = {
			descriptor: {
				name: "search_web",
				description: "Search web",
				inputSchemaJson: {},
				provider: "local",
			},
			async execute() {
				return toToolResultSuccess({ ok: true });
			},
		};

		const second: UnifiedTool = {
			descriptor: {
				name: "search_web",
				description: "Search web duplicate",
				inputSchemaJson: {},
				provider: "local",
			},
			async execute() {
				return toToolResultSuccess({ ok: true });
			},
		};

		const buildAttempt = buildToolRegistry([
			new FakeToolProvider([first]),
			new FakeToolProvider([second]),
		]);

		await expect(buildAttempt).rejects.toThrow("Duplicate tool name detected");
	});

	test("shuts down all providers", async () => {
		const p1 = new FakeToolProvider([]);
		const p2 = new FakeToolProvider([]);

		const registry = await buildToolRegistry([p1, p2]);
		await registry.shutdown();

		expect(p1.shutdownCallCount).toBe(1);
		expect(p2.shutdownCallCount).toBe(1);
	});
});
