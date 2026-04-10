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

	test("parses non-hardcoded provider names", () => {
		expect(parseModelSpec("google/gemini-2.5-pro")).toEqual({
			provider: "google",
			modelId: "gemini-2.5-pro",
		});
	});

	test("throws for missing provider separator", () => {
		expect(() => parseModelSpec("gpt-5.4-nano")).toThrow(
			"Expected format: <provider>/<model>",
		);
	});

	test("throws when provider segment is missing", () => {
		expect(() => parseModelSpec(" /gpt-5.4-nano")).toThrow(
			"Expected format: <provider>/<model>",
		);
	});
});
