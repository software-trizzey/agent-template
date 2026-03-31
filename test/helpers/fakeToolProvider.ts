import type { ToolProvider, UnifiedTool } from "../../src/core/types";

export class FakeToolProvider implements ToolProvider {
	private readonly tools: UnifiedTool[];
	public shutdownCallCount: number;

	constructor(tools: UnifiedTool[]) {
		this.tools = tools;
		this.shutdownCallCount = 0;
	}

	async listTools(): Promise<UnifiedTool[]> {
		return this.tools;
	}

	async shutdown(): Promise<void> {
		this.shutdownCallCount += 1;
	}
}
