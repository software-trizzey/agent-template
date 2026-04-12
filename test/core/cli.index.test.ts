import { describe, expect, test } from "bun:test";
import { createCliPromptHandler } from "../../src/core/cli";
import type { SessionMessage } from "../../src/core/types/model";

describe("createCliPromptHandler", () => {
	test("formats /models without running prompt execution", async () => {
		const history: SessionMessage[] = [];
		let runPromptCalls = 0;
		const handler = createCliPromptHandler({
			isReplMode: true,
			history,
			runPrompt: async () => {
				runPromptCalls += 1;
				return {
					output: "unused",
					history: [],
				};
			},
			models: {
				listModels() {
					return [
						{
							modelId: "claude-sonnet-4.7",
							modelName: "Claude Sonnet",
							providerName: "anthropic",
						},
						{
							modelId: "gpt-5",
							modelName: "GPT-5",
							providerName: "openai",
						},
					];
				},
			},
			currentModelSpec: "openai/gpt-5",
		} as Parameters<typeof createCliPromptHandler>[0]);

		const output = await handler("/models");

		expect(runPromptCalls).toBe(0);
		expect(output).toContain("Claude Sonnet");
		expect(output).toContain("anthropic");
		expect(output).toContain("GPT-5 openai [current]");
	});
});
