import { z } from "zod";

export const ToolPolicyInputSchema = z.object({
	toolName: z.string(),
	args: z.unknown(),
	context: z.unknown(),
});

export const ToolPolicyDecisionSchema = z.discriminatedUnion("allow", [
	z.object({
		allow: z.literal(true),
	}),
	z.object({
		allow: z.literal(false),
		code: z.literal("BUSINESS_RULE_VIOLATION"),
		reason: z.string(),
	}),
]);

export type ToolPolicyInput = z.infer<typeof ToolPolicyInputSchema>;
export type ToolPolicyDecision = z.infer<typeof ToolPolicyDecisionSchema>;
