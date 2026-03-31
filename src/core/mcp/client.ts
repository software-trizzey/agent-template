import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { toMcpErrorMessage, withTimeout } from "./errors";

export type McpClient = {
	listTools: () => Promise<unknown[]>;
	callTool: (input: {
		name: string;
		args: Record<string, unknown>;
		timeoutMs: number;
		maxRetries: number;
	}) => Promise<unknown>;
	close: () => Promise<void>;
};

function parseToolList(result: unknown): unknown[] {
	if (
		typeof result !== "object" ||
		result === null ||
		!("tools" in result) ||
		!Array.isArray(result.tools)
	) {
		return [];
	}

	return result.tools as unknown[];
}

export async function createStdioMcpClient(input: {
	serverId: string;
	command: string;
	args: string[];
	env: Record<string, string>;
	cwd?: string;
	startupTimeoutMs: number;
}): Promise<McpClient> {
	const client = new Client({
		name: "agent-template",
		version: "1.0.0",
	});

	const transport = new StdioClientTransport({
		command: input.command,
		args: input.args,
		env: input.env,
		cwd: input.cwd,
	});

	await withTimeout({
		promise: client.connect(transport),
		timeoutMs: input.startupTimeoutMs,
		timeoutMessage: `MCP server ${input.serverId} startup timed out`,
	});

	return {
		async listTools(): Promise<unknown[]> {
			try {
				const result = await client.listTools();
				return parseToolList(result);
			} catch (error) {
				throw new Error(
					toMcpErrorMessage(
						`Failed to list tools from MCP server ${input.serverId}`,
						error,
					),
				);
			}
		},
		async callTool(callInput): Promise<unknown> {
			let attempt = 0;
			const attemptLimit = callInput.maxRetries + 1;

			while (attempt < attemptLimit) {
				attempt += 1;
				try {
					return await withTimeout({
						promise: client.callTool({
							name: callInput.name,
							arguments: callInput.args,
						}),
						timeoutMs: callInput.timeoutMs,
						timeoutMessage: `MCP tool call timed out: ${input.serverId}/${callInput.name}`,
					});
				} catch (error) {
					if (attempt >= attemptLimit) {
						throw new Error(
							toMcpErrorMessage(
								`MCP tool call failed: ${input.serverId}/${callInput.name}`,
								error,
							),
						);
					}
				}
			}

			throw new Error(
				`MCP tool call failed: ${input.serverId}/${callInput.name}`,
			);
		},
		async close(): Promise<void> {
			await client.close();
		},
	};
}
