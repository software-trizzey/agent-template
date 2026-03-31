import type { McpConfig, McpServerConfig } from "../schemas/mcp";

export type { McpConfig, McpServerConfig };

export type NormalizedMcpServerConfig = McpServerConfig & {
	startupTimeoutMs: number;
	callTimeoutMs: number;
	maxRetries: number;
	maxDiscoveredTools: number;
	maxArgBytes: number;
	allowTools: string[];
	blockTools: string[];
};

export type NormalizedMcpConfig = {
	version: 1;
	servers: NormalizedMcpServerConfig[];
};
