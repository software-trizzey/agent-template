import { describe, expect, test } from "bun:test";
import { enforceMcpArgSize, isMcpToolAllowed } from "../../src/core/mcp";
import type { NormalizedMcpServerConfig } from "../../src/core/types";

function createServer(overrides: Partial<NormalizedMcpServerConfig> = {}) {
	const base: NormalizedMcpServerConfig = {
		id: "filesystem",
		transport: "stdio",
		command: "bunx",
		args: ["server"],
		startupTimeoutMs: 1000,
		callTimeoutMs: 1000,
		maxRetries: 0,
		maxDiscoveredTools: 10,
		maxArgBytes: 50,
		allowTools: ["read_*"],
		blockTools: ["read_secret"],
	};

	return { ...base, ...overrides };
}

describe("mcp guards", () => {
	test("allows tools by allowlist and blocks by blocklist", () => {
		const server = createServer();
		expect(isMcpToolAllowed(server, "read_file")).toBe(true);
		expect(isMcpToolAllowed(server, "read_secret")).toBe(false);
		expect(isMcpToolAllowed(server, "write_file")).toBe(false);
	});

	test("returns INVALID_TOOL_ARGUMENTS when args exceed max bytes", () => {
		const server = createServer({ maxArgBytes: 8 });
		const result = enforceMcpArgSize(server, { query: "123456789" });
		expect(result?.ok).toBe(false);
		if (result !== null) {
			expect(result.code).toBe("INVALID_TOOL_ARGUMENTS");
		}
	});
});
