import { McpConfigSchema } from "../schemas/mcp";
import type {
	NormalizedMcpConfig,
	NormalizedMcpServerConfig,
} from "../types/mcp";

const DEFAULT_STARTUP_TIMEOUT_MS = 15_000;
const DEFAULT_CALL_TIMEOUT_MS = 30_000;
const DEFAULT_MAX_RETRIES = 1;
const DEFAULT_MAX_DISCOVERED_TOOLS = 200;
const DEFAULT_MAX_ARG_BYTES = 32_768;

function normalizeServerConfig(server: {
	id: string;
	transport: "stdio";
	command: string;
	args: string[];
	env?: Record<string, string>;
	cwd?: string;
	startupTimeoutMs?: number;
	callTimeoutMs?: number;
	maxRetries?: number;
	maxDiscoveredTools?: number;
	maxArgBytes?: number;
	allowTools?: string[];
	blockTools?: string[];
}): NormalizedMcpServerConfig {
	return {
		...server,
		startupTimeoutMs: server.startupTimeoutMs ?? DEFAULT_STARTUP_TIMEOUT_MS,
		callTimeoutMs: server.callTimeoutMs ?? DEFAULT_CALL_TIMEOUT_MS,
		maxRetries: server.maxRetries ?? DEFAULT_MAX_RETRIES,
		maxDiscoveredTools:
			server.maxDiscoveredTools ?? DEFAULT_MAX_DISCOVERED_TOOLS,
		maxArgBytes: server.maxArgBytes ?? DEFAULT_MAX_ARG_BYTES,
		allowTools: server.allowTools ?? [],
		blockTools: server.blockTools ?? [],
	};
}

export async function loadMcpConfigFromPath(
	filePath: string,
): Promise<NormalizedMcpConfig> {
	const file = Bun.file(filePath);
	if (!(await file.exists())) {
		throw new Error(`MCP config file not found: ${filePath}`);
	}

	let rawConfig: unknown;
	try {
		rawConfig = await file.json();
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		throw new Error(`Failed to parse MCP config JSON: ${message}`);
	}

	const parsed = McpConfigSchema.safeParse(rawConfig);
	if (!parsed.success) {
		throw new Error(
			`Invalid MCP config at ${filePath}: ${parsed.error.issues[0]?.message ?? "unknown validation error"}`,
		);
	}

	return {
		version: 1,
		servers: parsed.data.servers.map(normalizeServerConfig),
	};
}
