import { z } from "zod";

export const ToolCallSchema = z.object({
	name: z.string(),
	args: z.unknown(),
	callId: z.string().optional(),
});

export const SessionToolCallSchema = z.object({
	id: z.string(),
	name: z.string(),
	args: z.unknown(),
});

export const SessionMessageSchema = z.object({
	role: z.enum(["user", "assistant", "tool"]),
	content: z.string(),
	name: z.string().optional(),
	toolCall: SessionToolCallSchema.optional(),
});

export const ModelToolDefinitionSchema = z.object({
	name: z.string(),
	description: z.string(),
	parameters: z.record(z.string(), z.unknown()),
	strict: z.boolean(),
});

export const ModelTurnInputSchema = z.object({
	instructions: z.string(),
	history: z.array(SessionMessageSchema),
	tools: z.array(ModelToolDefinitionSchema),
});

export const ModelTurnSchema = z.object({
	assistantText: z.string().nullable(),
	toolCall: ToolCallSchema.nullable(),
});

export type ToolCall = z.infer<typeof ToolCallSchema>;
export type SessionToolCall = z.infer<typeof SessionToolCallSchema>;
export type SessionMessage = z.infer<typeof SessionMessageSchema>;
export type ModelToolDefinition = z.infer<typeof ModelToolDefinitionSchema>;
export type ModelTurnInput = z.infer<typeof ModelTurnInputSchema>;
export type ModelTurn = z.infer<typeof ModelTurnSchema>;
