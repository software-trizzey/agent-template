import { z } from "zod";
import { SessionMessageSchema } from "./model";

export const RuntimeConfigDataSchema = z.object({
	model: z.string(),
	maxTurns: z.number().int().nonnegative(),
});

export const SessionInputSchema = z.object({
	instructions: z.string(),
	userText: z.string(),
	context: z.unknown(),
	history: z.array(SessionMessageSchema),
});

export const SessionTerminationReasonSchema = z.enum([
	"assistant_output",
	"max_turns",
]);

export const SessionResultSchema = z.object({
	finalAssistantMessage: z.string(),
	history: z.array(SessionMessageSchema),
	turnsUsed: z.number().int().nonnegative(),
	terminationReason: SessionTerminationReasonSchema,
});

export const SessionStateSchema = z.object({
	history: z.array(SessionMessageSchema),
	turnsUsed: z.number().int().nonnegative(),
});

export type RuntimeConfigData = z.infer<typeof RuntimeConfigDataSchema>;
export type SessionInput = z.infer<typeof SessionInputSchema>;
export type SessionTerminationReason = z.infer<
	typeof SessionTerminationReasonSchema
>;
export type SessionResult = z.infer<typeof SessionResultSchema>;
export type SessionState = z.infer<typeof SessionStateSchema>;
