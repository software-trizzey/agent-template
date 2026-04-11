import { createMcpToolProviderFromPath } from "../../core/mcp";
import { createSkillsRuntime } from "../../core/skills/runtime";
import type { AgentProfile, ToolProvider } from "../../core/types";

type DefaultProfileContext = {
	latestUserText: string;
};

type DefaultProfileEnv = {
	allowExternalTools: boolean;
	allowProjectSkills: boolean;
	userSkillsRoot?: string;
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
	async createProviders(env, dependencies): Promise<ToolProvider[]> {
		const providers: ToolProvider[] = [];
		if (dependencies?.skillsProvider !== undefined) {
			providers.push(dependencies.skillsProvider);
		} else {
			const skillsRuntime = await createSkillsRuntime({
				projectRoot: process.cwd(),
				allowProjectSkills: env.allowProjectSkills,
				userSkillRoot: env.userSkillsRoot,
			});
			for (const warning of skillsRuntime.registry.warnings) {
				const sourceSuffix =
					warning.sourcePath === undefined ? "" : ` (${warning.sourcePath})`;
				process.stderr.write(
					`[skills] ${warning.code} ${warning.message}${sourceSuffix}\n`,
				);
			}
			providers.push(skillsRuntime.provider);
		}

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
			allowProjectSkills: true,
		},
		parse(input): DefaultProfileEnv {
			return {
				allowExternalTools: parseBoolean(
					input.DEFAULT_PROFILE_ALLOW_EXTERNAL_TOOLS,
					true,
				),
				allowProjectSkills: parseBoolean(
					input.DEFAULT_PROFILE_ALLOW_PROJECT_SKILLS,
					true,
				),
				userSkillsRoot: parseOptionalString(
					input.DEFAULT_PROFILE_USER_SKILLS_ROOT,
				),
				mcpConfigPath: parseOptionalString(input.MCP_CONFIG_PATH),
			};
		},
	},
};
