import type {
	Api,
	AssistantMessage,
	Context as PiAiContext,
	Message as PiAiMessage,
	Model as PiAiModel,
	Tool as PiAiTool,
} from "@mariozechner/pi-ai";
import { complete } from "@mariozechner/pi-ai";
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
import { hideAssistantTextWhenToolCalled } from "./helpers";

function emptyUsage(): AssistantMessage["usage"] {
	return {
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
	};
}

function toPiAiTool(tool: ModelToolDefinition): PiAiTool {
	return {
		name: tool.name,
		description: tool.description,
		parameters: tool.parameters as PiAiTool["parameters"],
	};
}

function parseToolNameFromToolResult(content: string): string {
	try {
		const parsed = JSON.parse(content) as { toolName?: unknown };
		return typeof parsed.toolName === "string" ? parsed.toolName : "tool";
	} catch {
		return "tool";
	}
}

function toPiAiMessage(
	message: SessionMessage,
	model: PiAiModel<Api>,
): PiAiMessage {
	const timestamp = Date.now();

	if (message.role === "user") {
		return {
			role: "user",
			content: message.content,
			timestamp,
		};
	}

	if (message.role === "tool") {
		const toolCallId =
			typeof message.name === "string" && message.name.trim().length > 0
				? message.name
				: `tool_${crypto.randomUUID().replaceAll("-", "")}`;

		return {
			role: "toolResult",
			toolCallId,
			toolName: parseToolNameFromToolResult(message.content),
			content: [{ type: "text", text: message.content }],
			isError: false,
			timestamp,
		};
	}

	const contentBlocks: AssistantMessage["content"] = [];
	if (message.toolCall !== undefined) {
		contentBlocks.push({
			type: "toolCall",
			id: message.toolCall.id,
			name: message.toolCall.name,
			arguments: message.toolCall.args as Record<string, unknown>,
		});
	} else if (message.content.trim().length > 0) {
		contentBlocks.push({
			type: "text",
			text: message.content,
		});
	}

	return {
		role: "assistant",
		content: contentBlocks,
		api: model.api,
		provider: model.provider,
		model: model.id,
		usage: emptyUsage(),
		stopReason: "stop",
		timestamp,
	};
}

function toPiAiContext(input: {
	instructions: string;
	history: SessionMessage[];
	tools: ModelToolDefinition[];
	model: PiAiModel<Api>;
}): PiAiContext {
	return {
		systemPrompt: input.instructions,
		messages: input.history.map((message) =>
			toPiAiMessage(message, input.model),
		),
		tools: input.tools.map(toPiAiTool),
	};
}

function parseAssistantTurn(message: AssistantMessage): ModelTurn {
	let toolCall: ModelTurn["toolCall"] = null;
	const textSegments: string[] = [];

	for (const block of message.content) {
		if (block.type === "toolCall" && toolCall === null) {
			const parsedToolCall = ToolCallSchema.safeParse({
				name: block.name,
				args: block.arguments,
				callId: block.id,
			});
			if (parsedToolCall.success) {
				toolCall = parsedToolCall.data;
			}
			continue;
		}

		if (block.type === "text") {
			textSegments.push(block.text);
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

export function createPiAiModelAdapter(input: {
	model: PiAiModel<Api>;
	completeTurn: (
		model: PiAiModel<Api>,
		context: PiAiContext,
	) => Promise<AssistantMessage>;
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

			const assistantMessage = await input.completeTurn(
				input.model,
				toPiAiContext({
					instructions: parsedInput.instructions,
					history: parsedInput.history,
					tools: parsedInput.tools,
					model: input.model,
				}),
			);

			return parseAssistantTurn(assistantMessage);
		},
	});
}

export function createDefaultPiAiModelAdapter(input: {
	model: PiAiModel<Api>;
}) {
	return createPiAiModelAdapter({
		model: input.model,
		completeTurn: complete,
	});
}
