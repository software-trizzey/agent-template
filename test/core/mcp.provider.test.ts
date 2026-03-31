import { describe, expect, test } from "bun:test";
import { McpToolProvider } from "../../src/core/mcp";
import type { McpClient } from "../../src/core/mcp/client";
import type { NormalizedMcpConfig } from "../../src/core/types";

function buildConfig(): NormalizedMcpConfig {
	return {
		version: 1,
		servers: [
			{
				id: "ok",
				transport: "stdio",
				command: "bunx",
				args: ["ok-server"],
				startupTimeoutMs: 1000,
				callTimeoutMs: 1000,
				maxRetries: 0,
				maxDiscoveredTools: 10,
				maxArgBytes: 1024,
				allowTools: [],
				blockTools: [],
			},
			{
				id: "broken",
				transport: "stdio",
				command: "bunx",
				args: ["broken-server"],
				startupTimeoutMs: 1000,
				callTimeoutMs: 1000,
				maxRetries: 0,
				maxDiscoveredTools: 10,
				maxArgBytes: 1024,
				allowTools: [],
				blockTools: [],
			},
		],
	};
}

describe("McpToolProvider", () => {
	test("continues startup when one server fails", async () => {
		const warnings: string[] = [];
		const fakeClient: McpClient = {
			async listTools() {
				return [
					{
						name: "search_docs",
						description: "Search docs",
						inputSchema: { type: "object", properties: {} },
					},
				];
			},
			async callTool() {
				return {
					structuredContent: { ok: true },
				};
			},
			async close() {
				return;
			},
		};

		const provider = new McpToolProvider({
			config: buildConfig(),
			async createClient(input) {
				if (input.serverId === "broken") {
					throw new Error("unable to connect");
				}
				return fakeClient;
			},
			warn(message) {
				warnings.push(message);
			},
		});

		const tools = await provider.listTools();
		expect(tools).toHaveLength(1);
		expect(tools[0]?.descriptor.name).toBe("ok__search_docs");
		expect(warnings.some((value) => value.includes("broken"))).toBe(true);

		const result = await tools[0]?.execute({ query: "docs" }, {});
		expect(result?.ok).toBe(true);
	});
});
