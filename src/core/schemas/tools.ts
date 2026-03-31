import { z } from "zod";

export const ToolFailureCodeSchema = z.enum([
	"INVALID_TOOL_ARGUMENTS",
	"BUSINESS_RULE_VIOLATION",
	"TOOL_NOT_FOUND",
	"TOOL_EXECUTION_ERROR",
]);

export const ToolExecutionSuccessSchema = z.object({
	ok: z.literal(true),
	data: z.unknown(),
});

export const ToolExecutionFailureSchema = z.object({
	ok: z.literal(false),
	code: ToolFailureCodeSchema,
	message: z.string(),
});

export const ToolExecutionResultSchema = z.discriminatedUnion("ok", [
	ToolExecutionSuccessSchema,
	ToolExecutionFailureSchema,
]);

export const ToolArgumentsObjectSchema = z.object({}).catchall(z.unknown());

export const UnifiedToolDescriptorSchema = z.object({
	name: z.string(),
	description: z.string(),
	inputSchemaJson: z.record(z.string(), z.unknown()),
	provider: z.enum(["local", "mcp"]),
});

export type ToolFailureCode = z.infer<typeof ToolFailureCodeSchema>;
export type ToolExecutionSuccess = z.infer<typeof ToolExecutionSuccessSchema>;
export type ToolExecutionFailure = z.infer<typeof ToolExecutionFailureSchema>;
export type ToolExecutionResult = z.infer<typeof ToolExecutionResultSchema>;
export type UnifiedToolDescriptor = z.infer<typeof UnifiedToolDescriptorSchema>;
