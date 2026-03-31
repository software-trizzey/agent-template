import type { ToolPolicy } from "./policy";
import type { ToolProvider } from "./tools";

export type ProfileEnvConfig<Env> = {
	defaults: Env;
	parse?: (input: Record<string, string | undefined>) => Env;
};

export type AgentProfile<Context, Env> = {
	id: string;
	instructions: string;
	deriveContext: (input: { userText: string; history: string[] }) => Context;
	createProviders: (env: Env) => Promise<ToolProvider[]>;
	policies: ToolPolicy[];
	env: ProfileEnvConfig<Env>;
};
