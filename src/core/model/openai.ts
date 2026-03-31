import type OpenAI from "openai";
import type { ResponseInputItem } from "openai/resources/responses/responses";
import {
	ModelTurnInputSchema,
	ModelTurnSchema,
	ToolCallSchema,
} from "../schemas/model";
import { UnifiedToolDescriptorSchema } from "../schemas/tools";
import type {
	ModelToolDefinition,
	ModelTurn,
	ModelTurnInput,
	SessionMessage,
} from "../types/model";
import type { UnifiedToolDescriptor } from "../types/tools";
import { createModelAdapter } from "./adapter";
import {
	hideAssistantTextWhenToolCalled,
	isRecord,
	parseJsonStringOrRaw,
} from "./helpers";
import { toOpenAIToolParameters } from "./openai-schema";

function toInputItem(message: SessionMessage): ResponseInputItem {
	if (message.role === "tool") {
		return {
			type: "function_call_output",
			call_id: message.name ?? "tool-call",
			output: message.content,
		};
	}

	return {
		type: "message",
		role: message.role,
		content: [
			{
				type: "input_text",
				text: message.content,
			},
		],
	};
}

function parseModelTurn(
	outputText: string | null,
	output: unknown[],
): ModelTurn {
	let toolCall: ModelTurn["toolCall"] = null;

	for (const item of output) {
		if (!isRecord(item)) {
			continue;
		}

		if (item.type !== "function_call") {
			continue;
		}

		const toolName = item.name;
		if (typeof toolName !== "string") {
			continue;
		}

		let parsedArgs: unknown = {};
		const rawArguments = item.arguments;
		if (typeof rawArguments === "string" && rawArguments.trim().length > 0) {
			parsedArgs = parseJsonStringOrRaw(rawArguments);
		}

		const toolCallResult = ToolCallSchema.safeParse({
			name: toolName,
			args: parsedArgs,
			callId: typeof item.call_id === "string" ? item.call_id : undefined,
		});
		if (!toolCallResult.success) {
			continue;
		}

		toolCall = toolCallResult.data;
		break;
	}

	const assistantText = hideAssistantTextWhenToolCalled({
		assistantText: outputText,
		hasToolCall: toolCall !== null,
	});

	return ModelTurnSchema.parse({
		assistantText,
		toolCall,
	});
}

export function createOpenAIModelAdapter(input: {
	client: OpenAI;
	model: string;
}) {
	return createModelAdapter({
		toModelTool(descriptor: UnifiedToolDescriptor): ModelToolDefinition {
			const parsedDescriptor = UnifiedToolDescriptorSchema.parse(descriptor);
			const isMcpTool = parsedDescriptor.provider === "mcp";
			return {
				name: parsedDescriptor.name,
				description: parsedDescriptor.description,
				strict: !isMcpTool,
				parameters: toOpenAIToolParameters({
					inputSchemaJson: parsedDescriptor.inputSchemaJson,
					isMcpTool,
				}),
			};
		},
		async nextTurn(modelInput: ModelTurnInput): Promise<ModelTurn> {
			const parsedInput = ModelTurnInputSchema.parse(modelInput);
			const response = await input.client.responses.create({
				model: input.model,
				instructions: parsedInput.instructions,
				input: parsedInput.history.map(toInputItem),
				tools: parsedInput.tools.map((tool) => ({
					type: "function",
					name: tool.name,
					description: tool.description,
					parameters: tool.parameters,
					strict: tool.strict,
				})),
			});

			const outputText = response.output_text ?? null;
			const output = Array.isArray(response.output)
				? (response.output as unknown[])
				: [];

			return parseModelTurn(outputText, output);
		},
	});
}
