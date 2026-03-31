import type Anthropic from "@anthropic-ai/sdk";
import type OpenAI from "openai";
import type { ModelAdapter } from "../types/model";
import { createAnthropicModelAdapter } from "./anthropic";
import { createOpenAIModelAdapter } from "./openai";
import { parseModelSpec } from "./spec";

export function createModelAdapterFromSpec(input: {
	modelSpec: string;
	createOpenAIClient: () => OpenAI;
	createAnthropicClient: () => Anthropic;
}): ModelAdapter {
	const parsed = parseModelSpec(input.modelSpec);

	if (parsed.provider === "openai") {
		return createOpenAIModelAdapter({
			client: input.createOpenAIClient(),
			model: parsed.modelId,
		});
	}

	return createAnthropicModelAdapter({
		client: input.createAnthropicClient(),
		model: parsed.modelId,
	});
}
