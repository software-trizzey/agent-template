import type { ToolProvider, ToolRegistry, UnifiedTool } from "../types/tools";

export async function buildToolRegistry(
	providers: ToolProvider[],
): Promise<ToolRegistry> {
	const index = new Map<string, UnifiedTool>();

	for (const provider of providers) {
		const tools = await provider.listTools();
		for (const tool of tools) {
			const toolName = tool.descriptor.name;
			if (index.has(toolName)) {
				throw new Error(`Duplicate tool name detected: ${toolName}`);
			}

			index.set(toolName, tool);
		}
	}

	return {
		listTools(): UnifiedTool[] {
			return Array.from(index.values());
		},
		resolve(toolName: string): UnifiedTool | null {
			return index.get(toolName) ?? null;
		},
		async shutdown(): Promise<void> {
			for (const provider of providers) {
				await provider.shutdown();
			}
		},
	};
}
