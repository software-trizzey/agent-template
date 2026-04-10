import { describe, expect, test } from "bun:test";
import { createModelAdapterFromSpec } from "../../src/core/model";

describe("createModelAdapterFromSpec", () => {
	test("creates adapter for known provider/model pair", () => {
		const adapter = createModelAdapterFromSpec({
			modelSpec: "openai/gpt-5.3-codex",
		});

		expect(typeof adapter.nextTurn).toBe("function");
	});

	test("throws for unknown provider", () => {
		expect(() =>
			createModelAdapterFromSpec({
				modelSpec: "not-a-provider/model-x",
			}),
		).toThrow("Unsupported model provider");
	});

	test("throws for unknown model in known provider", () => {
		expect(() =>
			createModelAdapterFromSpec({
				modelSpec: "openai/not-a-real-model",
			}),
		).toThrow("No matching model id found");
	});
});
