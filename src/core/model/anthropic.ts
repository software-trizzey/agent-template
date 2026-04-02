import type Anthropic from "@anthropic-ai/sdk";
import type {
	ContentBlock,
	MessageParam,
	Tool,
} from "@anthropic-ai/sdk/resources/messages/messages";
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
	normalizeObjectToolSchema,
} from "./helpers";

function toAnthropicInputSchema(
	input: Record<string, unknown>,
): Tool.InputSchema {
	return normalizeObjectToolSchema(input);
}

function toAnthropicMessage(message: SessionMessage): MessageParam {
	if (message.role === "assistant" && message.toolCall !== undefined) {
		return {
			role: "assistant",
			content: [
				{
					type: "tool_use",
					id: message.toolCall.id,
					name: message.toolCall.name,
					input: message.toolCall.args,
				},
			],
		};
	}

	if (message.role === "tool") {
		const toolUseId = message.name?.trim();
		if (toolUseId !== undefined && toolUseId.length > 0) {
			return {
				role: "user",
				content: [
					{
						type: "tool_result",
						tool_use_id: toolUseId,
						content: message.content,
					},
				],
			};
		}

		return {
			role: "user",
			content: [
				{
					type: "text",
					text: message.content,
				},
			],
		};
	}

	return {
		role: message.role,
		content: [
			{
				type: "text",
				text: message.content,
			},
		],
	};
}

function parseAnthropicTurn(content: unknown[]): ModelTurn {
	let toolCall: ModelTurn["toolCall"] = null;
	const textSegments: string[] = [];

	for (const block of content) {
		if (typeof block !== "object" || block === null) {
			continue;
		}

		const typedBlock = block as {
			type?: string;
			text?: string;
			id?: string;
			name?: string;
			input?: unknown;
		};

		if (typedBlock.type === "tool_use" && toolCall === null) {
			if (typeof typedBlock.name === "string") {
				const toolCallResult = ToolCallSchema.safeParse({
					name: typedBlock.name,
					args: typedBlock.input ?? {},
					callId: typeof typedBlock.id === "string" ? typedBlock.id : undefined,
				});
				if (toolCallResult.success) {
					toolCall = toolCallResult.data;
				}
			}
			continue;
		}

		if (typedBlock.type === "text" && typeof typedBlock.text === "string") {
			textSegments.push(typedBlock.text);
		}
	}

	const joinedText = textSegments.join("\n").trim();
	const assistantText = hideAssistantTextWhenToolCalled({
		assistantText: joinedText.length > 0 ? joinedText : null,
		hasToolCall: toolCall !== null,
	});

	return ModelTurnSchema.parse({
		assistantText,
		toolCall,
	});
}

export function createAnthropicModelAdapter(input: {
	client: Anthropic;
	model: string;
}) {
	return createModelAdapter({
		toModelTool(descriptor: UnifiedToolDescriptor): ModelToolDefinition {
			const parsedDescriptor = UnifiedToolDescriptorSchema.parse(descriptor);
			return {
				name: parsedDescriptor.name,
				description: parsedDescriptor.description,
				parameters: parsedDescriptor.inputSchemaJson,
				strict: parsedDescriptor.provider !== "mcp",
			};
		},
		async nextTurn(modelInput: ModelTurnInput): Promise<ModelTurn> {
			const parsedInput = ModelTurnInputSchema.parse(modelInput);
			const response = await input.client.messages.create({
				model: input.model,
				system: parsedInput.instructions,
				max_tokens: 4096,
				messages: parsedInput.history.map(toAnthropicMessage),
				tools: parsedInput.tools.map((tool) => ({
					name: tool.name,
					description: tool.description,
					input_schema: toAnthropicInputSchema(tool.parameters),
				})),
			});

			return parseAnthropicTurn(
				Array.isArray(response.content)
					? (response.content as unknown[])
					: ([] as ContentBlock[]),
			);
		},
	});
}
