import { describe, expect, test } from "bun:test";
import type OpenAI from "openai";
import { createOpenAIModelAdapter } from "../../src/core/model/openai";
import type { ModelTurnInput } from "../../src/core/types";

type CreateArgs = {
	input: unknown;
	instructions: string;
	model: string;
	tools: unknown[];
};

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

describe("openai model adapter", () => {
	test("serializes assistant tool-call history and plain message text", async () => {
		const captured = { current: undefined as CreateArgs | undefined };
		const client = {
			responses: {
				async create(args: CreateArgs) {
					captured.current = args;
					return {
						output_text: null,
						output: [
							{
								type: "function_call",
								name: "search_web",
								arguments: '{"query":"bun"}',
								call_id: "call_res_1",
							},
						],
					};
				},
			},
		} as unknown as OpenAI;

		const adapter = createOpenAIModelAdapter({
			client,
			model: "gpt-test",
		});

		await adapter.nextTurn(
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
					content: '{"result":"ok"}',
				},
			]),
		);

		expect(captured.current).toBeDefined();
		if (captured.current === undefined) {
			throw new Error("expected openai request args to be captured");
		}
		expect(captured.current.input).toEqual([
			{ type: "message", role: "user", content: "Find docs" },
			{
				type: "function_call",
				call_id: "call_hist_1",
				name: "search_web",
				arguments: '{"query":"docs"}',
			},
			{
				type: "function_call_output",
				call_id: "call_hist_1",
				output: '{"result":"ok"}',
			},
		]);
	});

	test("preserves follow-up tool-call output chain ids", async () => {
		const captured = { current: undefined as CreateArgs | undefined };
		const client = {
			responses: {
				async create(args: CreateArgs) {
					captured.current = args;
					return {
						output_text: "Done.",
						output: [],
					};
				},
			},
		} as unknown as OpenAI;

		const adapter = createOpenAIModelAdapter({
			client,
			model: "gpt-test",
		});

		await adapter.nextTurn(
			makeInput([
				{ role: "user", content: "First turn" },
				{
					role: "assistant",
					content: "",
					toolCall: {
						id: "call_roundtrip",
						name: "search_web",
						args: { query: "agent-template" },
					},
				},
				{
					role: "tool",
					name: "call_roundtrip",
					content: '{"result":"found"}',
				},
				{ role: "user", content: "Summarize that" },
			]),
		);

		if (captured.current === undefined) {
			throw new Error("expected openai request args to be captured");
		}
		const inputItems = captured.current.input as Array<Record<string, unknown>>;
		expect(inputItems[1]).toEqual({
			type: "function_call",
			call_id: "call_roundtrip",
			name: "search_web",
			arguments: '{"query":"agent-template"}',
		});
		expect(inputItems[2]).toEqual({
			type: "function_call_output",
			call_id: "call_roundtrip",
			output: '{"result":"found"}',
		});
	});
});
