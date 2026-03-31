import { describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { loadMcpConfigFromPath } from "../../src/core/mcp";

async function writeJsonFile(value: unknown): Promise<string> {
	const path = `/tmp/agent-template-${randomUUID()}.json`;
	await Bun.write(path, JSON.stringify(value));
	return path;
}

describe("loadMcpConfigFromPath", () => {
	test("loads config and applies defaults", async () => {
		const filePath = await writeJsonFile({
			version: 1,
			servers: [
				{
					id: "filesystem",
					transport: "stdio",
					command: "bunx",
					args: ["foo"],
				},
			],
		});

		const config = await loadMcpConfigFromPath(filePath);
		expect(config.servers).toHaveLength(1);
		expect(config.servers[0]?.startupTimeoutMs).toBe(15000);
		expect(config.servers[0]?.callTimeoutMs).toBe(30000);
		expect(config.servers[0]?.maxRetries).toBe(1);
		expect(config.servers[0]?.allowTools).toEqual([]);
	});

	test("throws when config is invalid", async () => {
		const filePath = await writeJsonFile({
			version: 2,
			servers: [],
		});

		await expect(loadMcpConfigFromPath(filePath)).rejects.toThrow(
			"Invalid MCP config",
		);
	});
});
