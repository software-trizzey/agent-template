import { describe, expect, test } from "bun:test";
import type { Api, Context, Model } from "@mariozechner/pi-ai";
import { createPiAiModelAdapter } from "../../src/core/model/pi-ai";
import type { ModelTurnInput } from "../../src/core/types";

function makeModel(): Model<Api> {
	return {
		id: "gpt-test",
		name: "gpt-test",
		api: "openai-responses",
		provider: "openai",
		baseUrl: "https://api.example.com",
		reasoning: false,
		input: ["text"],
		cost: {
			input: 0,
			output: 0,
			cacheRead: 0,
			cacheWrite: 0,
		},
		contextWindow: 128000,
		maxTokens: 4096,
	};
}

function makeInput(history: ModelTurnInput["history"]): ModelTurnInput {
	return {
		instructions: "You are helpful.",
		history,
		tools: [
			{
				name: "search_web",
				description: "Search the web",
				parameters: { type: "object", properties: {} },
				strict: true,
			},
		],
	};
}

describe("pi-ai model adapter", () => {
	test("maps history into pi-ai context and returns tool calls", async () => {
		const captured = { context: undefined as Context | undefined };
		const adapter = createPiAiModelAdapter({
			model: makeModel(),
			async completeTurn(_model, context) {
				captured.context = context;
				return {
					role: "assistant",
					api: "openai-responses",
					provider: "openai",
					model: "gpt-test",
					content: [
						{
							type: "toolCall",
							id: "call_res_1",
							name: "search_web",
							arguments: { query: "bun" },
						},
					],
					usage: {
						input: 0,
						output: 0,
						cacheRead: 0,
						cacheWrite: 0,
						totalTokens: 0,
						cost: {
							input: 0,
							output: 0,
							cacheRead: 0,
							cacheWrite: 0,
							total: 0,
						},
					},
					stopReason: "toolUse",
					timestamp: Date.now(),
				};
			},
		});

		const result = await adapter.nextTurn(
			makeInput([
				{ role: "user", content: "Find docs" },
				{
					role: "assistant",
					content: "",
					toolCall: {
						id: "call_hist_1",
						name: "search_web",
						args: { query: "docs" },
					},
				},
				{
					role: "tool",
					name: "call_hist_1",
					content: '{"toolName":"search_web","result":{"ok":true}}',
				},
			]),
		);

		expect(result.assistantText).toBeNull();
		expect(result.toolCall).toEqual({
			name: "search_web",
			args: { query: "bun" },
			callId: "call_res_1",
		});

		expect(captured.context?.systemPrompt).toBe("You are helpful.");
		expect(captured.context?.messages[0]).toMatchObject({
			role: "user",
			content: "Find docs",
		});
		expect(captured.context?.messages[1]).toMatchObject({
			role: "assistant",
			content: [
				{
					type: "toolCall",
					id: "call_hist_1",
					name: "search_web",
					arguments: { query: "docs" },
				},
			],
		});
		expect(captured.context?.messages[2]).toMatchObject({
			role: "toolResult",
			toolCallId: "call_hist_1",
			toolName: "search_web",
			content: [
				{
					type: "text",
					text: '{"toolName":"search_web","result":{"ok":true}}',
				},
			],
		});
	});

	test("returns assistant text when no tool call is present", async () => {
		const adapter = createPiAiModelAdapter({
			model: makeModel(),
			async completeTurn() {
				return {
					role: "assistant",
					api: "openai-responses",
					provider: "openai",
					model: "gpt-test",
					content: [{ type: "text", text: "Done." }],
					usage: {
						input: 0,
						output: 0,
						cacheRead: 0,
						cacheWrite: 0,
						totalTokens: 0,
						cost: {
							input: 0,
							output: 0,
							cacheRead: 0,
							cacheWrite: 0,
							total: 0,
						},
					},
					stopReason: "stop",
					timestamp: Date.now(),
				};
			},
		});

		const result = await adapter.nextTurn(
			makeInput([{ role: "user", content: "Hi" }]),
		);
		expect(result.assistantText).toBe("Done.");
		expect(result.toolCall).toBeNull();
	});
});
