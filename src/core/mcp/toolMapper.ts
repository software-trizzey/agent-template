import type { UnifiedToolDescriptor } from "../types/tools";

export type McpListedTool = {
	name: string;
	description?: string;
	inputSchema?: unknown;
	input_schema?: unknown;
};

export function toNamespacedMcpToolName(
	serverId: string,
	toolName: string,
): string {
	return `${serverId}__${toolName}`;
}

function toInputSchemaJson(tool: McpListedTool): Record<string, unknown> {
	const inputSchema = tool.inputSchema ?? tool.input_schema;
	if (inputSchema === null || typeof inputSchema !== "object") {
		return {};
	}

	return inputSchema as Record<string, unknown>;
}

export function toMcpUnifiedToolDescriptor(input: {
	serverId: string;
	tool: McpListedTool;
}): UnifiedToolDescriptor {
	const namespacedName = toNamespacedMcpToolName(
		input.serverId,
		input.tool.name,
	);

	return {
		name: namespacedName,
		description: input.tool.description ?? `MCP tool ${input.tool.name}`,
		inputSchemaJson: toInputSchemaJson(input.tool),
		provider: "mcp",
	};
}
