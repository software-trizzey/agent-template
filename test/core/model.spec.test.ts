import { describe, expect, test } from "bun:test";
import { parseModelSpec } from "../../src/core/model";

describe("parseModelSpec", () => {
	test("parses openai namespaced model", () => {
		expect(parseModelSpec("openai/gpt-5.4-nano")).toEqual({
			provider: "openai",
			modelId: "gpt-5.4-nano",
		});
	});

	test("parses anthropic namespaced model", () => {
		expect(parseModelSpec("anthropic/claude-sonnet-4.7")).toEqual({
			provider: "anthropic",
			modelId: "claude-sonnet-4.7",
		});
	});

	test("throws for missing provider separator", () => {
		expect(() => parseModelSpec("gpt-5.4-nano")).toThrow(
			"Expected format: <provider>/<model>",
		);
	});

	test("throws for unsupported provider", () => {
		expect(() => parseModelSpec("google/gemini-2.5-pro")).toThrow(
			"Unsupported model provider",
		);
	});
});
