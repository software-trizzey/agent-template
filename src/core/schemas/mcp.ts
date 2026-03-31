import { z } from "zod";

const ToolPatternSchema = z.string().min(1);

export const McpServerConfigSchema = z.object({
	id: z.string().min(1),
	transport: z.literal("stdio"),
	command: z.string().min(1),
	args: z.array(z.string()),
	env: z.record(z.string(), z.string()).optional(),
	cwd: z.string().min(1).optional(),
	startupTimeoutMs: z.number().int().positive().optional(),
	callTimeoutMs: z.number().int().positive().optional(),
	maxRetries: z.number().int().nonnegative().optional(),
	maxDiscoveredTools: z.number().int().positive().optional(),
	maxArgBytes: z.number().int().positive().optional(),
	allowTools: z.array(ToolPatternSchema).optional(),
	blockTools: z.array(ToolPatternSchema).optional(),
});

export const McpConfigSchema = z.object({
	version: z.literal(1),
	servers: z.array(McpServerConfigSchema),
});

export type McpServerConfig = z.infer<typeof McpServerConfigSchema>;
export type McpConfig = z.infer<typeof McpConfigSchema>;
