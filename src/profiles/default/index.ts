import { createMcpToolProviderFromPath } from "../../core/mcp";
import type { AgentProfile, ToolProvider } from "../../core/types";

type DefaultProfileContext = {
	latestUserText: string;
};

type DefaultProfileEnv = {
	allowExternalTools: boolean;
	mcpConfigPath?: string;
};

function parseOptionalString(value: string | undefined): string | undefined {
	if (value === undefined) {
		return undefined;
	}

	const trimmed = value.trim();
	if (trimmed.length === 0) {
		return undefined;
	}

	return trimmed;
}

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
	if (value === undefined) {
		return fallback;
	}

	const normalized = value.trim().toLowerCase();
	if (normalized === "1" || normalized === "true" || normalized === "yes") {
		return true;
	}

	if (normalized === "0" || normalized === "false" || normalized === "no") {
		return false;
	}

	return fallback;
}

function createEmptyLocalProvider(): ToolProvider {
	return {
		async listTools() {
			return [];
		},
		async shutdown() {
			return;
		},
	};
}

export const defaultProfile: AgentProfile<
	DefaultProfileContext,
	DefaultProfileEnv
> = {
	id: "default",
	instructions:
		"Act as a precise, domain-agnostic assistant. Prefer concise answers and use available tools only when needed.",
	deriveContext(input): DefaultProfileContext {
		return {
			latestUserText: input.userText.trim(),
		};
	},
	async createProviders(env): Promise<ToolProvider[]> {
		const providers: ToolProvider[] = [createEmptyLocalProvider()];
		if (!env.allowExternalTools) {
			return providers;
		}

		if (env.mcpConfigPath === undefined) {
			return providers;
		}

		const mcpProvider = await createMcpToolProviderFromPath({
			filePath: env.mcpConfigPath,
			warn(message): void {
				process.stderr.write(`[mcp] ${message}\n`);
			},
		});
		providers.push(mcpProvider);
		return providers;
	},
	policies: [],
	env: {
		defaults: {
			allowExternalTools: true,
		},
		parse(input): DefaultProfileEnv {
			return {
				allowExternalTools: parseBoolean(
					input.DEFAULT_PROFILE_ALLOW_EXTERNAL_TOOLS,
					true,
				),
				mcpConfigPath: parseOptionalString(input.MCP_CONFIG_PATH),
			};
		},
	},
};
