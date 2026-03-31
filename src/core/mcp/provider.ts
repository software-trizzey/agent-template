import { toToolResultFailure, toToolResultSuccess } from "../tools/result";
import type {
	NormalizedMcpConfig,
	NormalizedMcpServerConfig,
} from "../types/mcp";
import type {
	ToolExecutionResult,
	ToolProvider,
	UnifiedTool,
} from "../types/tools";
import { createStdioMcpClient, type McpClient } from "./client";
import { loadMcpConfigFromPath } from "./config";
import { enforceMcpArgSize, isMcpToolAllowed } from "./guards";
import { type McpListedTool, toMcpUnifiedToolDescriptor } from "./toolMapper";

type McpClientFactoryInput = {
	serverId: string;
	command: string;
	args: string[];
	env: Record<string, string>;
	cwd?: string;
	startupTimeoutMs: number;
};

export type McpClientFactory = (
	input: McpClientFactoryInput,
) => Promise<McpClient>;

type ProviderWarningFn = (message: string) => void;

function toWarningLogger(
	warn: ProviderWarningFn | undefined,
): ProviderWarningFn {
	if (warn !== undefined) {
		return warn;
	}

	return (message: string) => {
		process.stderr.write(`${message}\n`);
	};
}

function toTextContent(value: unknown): string {
	if (typeof value === "string") {
		return value;
	}

	if (typeof value !== "object" || value === null || !Array.isArray(value)) {
		return JSON.stringify(value);
	}

	const lines: string[] = [];
	for (const item of value) {
		if (
			typeof item === "object" &&
			item !== null &&
			"type" in item &&
			item.type === "text" &&
			"text" in item &&
			typeof item.text === "string"
		) {
			lines.push(item.text);
		}
	}

	return lines.join("\n");
}

function toMcpToolExecutionResult(raw: unknown): ToolExecutionResult {
	if (typeof raw !== "object" || raw === null) {
		return toToolResultSuccess(raw);
	}

	const typed = raw as {
		isError?: boolean;
		content?: unknown;
		structuredContent?: unknown;
	};

	if (typed.isError) {
		return toToolResultFailure(
			"TOOL_EXECUTION_ERROR",
			toTextContent(typed.content),
		);
	}

	if (typed.structuredContent !== undefined) {
		return toToolResultSuccess(typed.structuredContent);
	}

	if (typed.content !== undefined) {
		return toToolResultSuccess(typed.content);
	}

	return toToolResultSuccess(raw);
}

function toMcpListedTools(raw: unknown[]): McpListedTool[] {
	const listed: McpListedTool[] = [];

	for (const item of raw) {
		if (typeof item !== "object" || item === null) {
			continue;
		}

		if (!("name" in item) || typeof item.name !== "string") {
			continue;
		}

		listed.push(item as McpListedTool);
	}

	return listed;
}

export class McpToolProvider implements ToolProvider {
	private readonly config: NormalizedMcpConfig;
	private readonly createClient: McpClientFactory;
	private readonly warn: ProviderWarningFn;
	private toolsCache: UnifiedTool[] | null;
	private readonly clients: McpClient[];

	constructor(input: {
		config: NormalizedMcpConfig;
		createClient?: McpClientFactory;
		warn?: ProviderWarningFn;
	}) {
		this.config = input.config;
		this.createClient = input.createClient ?? createStdioMcpClient;
		this.warn = toWarningLogger(input.warn);
		this.toolsCache = null;
		this.clients = [];
	}

	private async discoverServerTools(
		server: NormalizedMcpServerConfig,
	): Promise<UnifiedTool[]> {
		if (server.transport !== "stdio") {
			this.warn(
				`Skipping MCP server ${server.id}: unsupported transport ${server.transport}`,
			);
			return [];
		}

		const client = await this.createClient({
			serverId: server.id,
			command: server.command,
			args: server.args,
			env: server.env ?? {},
			cwd: server.cwd,
			startupTimeoutMs: server.startupTimeoutMs,
		});

		this.clients.push(client);
		const rawTools = await client.listTools();
		const listedTools = toMcpListedTools(rawTools).filter((tool) =>
			isMcpToolAllowed(server, tool.name),
		);

		if (listedTools.length > server.maxDiscoveredTools) {
			this.warn(
				`MCP server ${server.id} reported ${listedTools.length} tools, capping at ${server.maxDiscoveredTools}`,
			);
		}

		const selectedTools = listedTools.slice(0, server.maxDiscoveredTools);

		return selectedTools.map((tool): UnifiedTool => {
			const descriptor = toMcpUnifiedToolDescriptor({
				serverId: server.id,
				tool,
			});

			return {
				descriptor,
				async execute(args: unknown): Promise<ToolExecutionResult> {
					const typedArgs = args as Record<string, unknown>;
					const oversized = enforceMcpArgSize(server, typedArgs);
					if (oversized !== null) {
						return oversized;
					}

					if (!isMcpToolAllowed(server, tool.name)) {
						return toToolResultFailure(
							"BUSINESS_RULE_VIOLATION",
							`MCP tool not allowed by config: ${server.id}/${tool.name}`,
						);
					}

					try {
						const result = await client.callTool({
							name: tool.name,
							args: typedArgs,
							timeoutMs: server.callTimeoutMs,
							maxRetries: server.maxRetries,
						});
						return toMcpToolExecutionResult(result);
					} catch (error) {
						const message =
							error instanceof Error ? error.message : String(error);
						return toToolResultFailure("TOOL_EXECUTION_ERROR", message);
					}
				},
			};
		});
	}

	async listTools(): Promise<UnifiedTool[]> {
		if (this.toolsCache !== null) {
			return this.toolsCache;
		}

		const tools: UnifiedTool[] = [];
		for (const server of this.config.servers) {
			try {
				const serverTools = await this.discoverServerTools(server);
				tools.push(...serverTools);
			} catch (error) {
				const message = error instanceof Error ? error.message : String(error);
				this.warn(`Skipping MCP server ${server.id}: ${message}`);
			}
		}

		this.toolsCache = tools;
		return tools;
	}

	async shutdown(): Promise<void> {
		for (const client of this.clients) {
			await client.close();
		}
	}
}

export async function createMcpToolProviderFromPath(input: {
	filePath: string;
	warn?: ProviderWarningFn;
}): Promise<ToolProvider> {
	const config = await loadMcpConfigFromPath(input.filePath);
	return new McpToolProvider({
		config,
		warn: input.warn,
	});
}
