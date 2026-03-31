import type { AgentProfile, ToolProvider } from "../../core/types";

type DefaultProfileContext = {
	latestUserText: string;
};

type DefaultProfileEnv = {
	allowExternalTools: boolean;
};

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
	async createProviders(): Promise<ToolProvider[]> {
		return [createEmptyLocalProvider()];
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
			};
		},
	},
};
