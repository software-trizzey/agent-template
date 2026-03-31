import { describe, expect, test } from "bun:test";
import type Anthropic from "@anthropic-ai/sdk";
import type OpenAI from "openai";
import { createModelAdapterFromSpec } from "../../src/core/model";

describe("createModelAdapterFromSpec", () => {
	test("creates OpenAI adapter for openai/* models", () => {
		let openaiCalls = 0;
		let anthropicCalls = 0;

		const adapter = createModelAdapterFromSpec({
			modelSpec: "openai/gpt-5.4-nano",
			createOpenAIClient() {
				openaiCalls += 1;
				return {} as OpenAI;
			},
			createAnthropicClient() {
				anthropicCalls += 1;
				return {} as Anthropic;
			},
		});

		expect(typeof adapter.nextTurn).toBe("function");
		expect(openaiCalls).toBe(1);
		expect(anthropicCalls).toBe(0);
	});

	test("creates Anthropic adapter for anthropic/* models", () => {
		let openaiCalls = 0;
		let anthropicCalls = 0;

		const adapter = createModelAdapterFromSpec({
			modelSpec: "anthropic/claude-sonnet-4.7",
			createOpenAIClient() {
				openaiCalls += 1;
				return {} as OpenAI;
			},
			createAnthropicClient() {
				anthropicCalls += 1;
				return {} as Anthropic;
			},
		});

		expect(typeof adapter.nextTurn).toBe("function");
		expect(openaiCalls).toBe(0);
		expect(anthropicCalls).toBe(1);
	});
});
