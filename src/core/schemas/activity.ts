import { z } from "zod";
import { ToolFailureCodeSchema } from "./tools";

export const ActivityEventSchema = z.discriminatedUnion("type", [
	z.object({
		type: z.literal("turn_started"),
		turn: z.number().int().nonnegative(),
	}),
	z.object({
		type: z.literal("turn_finished"),
		turn: z.number().int().nonnegative(),
	}),
	z.object({
		type: z.literal("tool_started"),
		turn: z.number().int().nonnegative(),
		toolName: z.string(),
	}),
	z.object({
		type: z.literal("tool_finished"),
		turn: z.number().int().nonnegative(),
		toolName: z.string(),
		ok: z.boolean(),
		code: ToolFailureCodeSchema.nullable(),
	}),
]);

export type ActivityEvent = z.infer<typeof ActivityEventSchema>;
