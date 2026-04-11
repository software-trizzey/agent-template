import { homedir } from "node:os";
import { resolve } from "node:path";
import { SkillActivator } from "./activator";
import { createSkillRegistry } from "./registry";
import { createSkillsToolProvider } from "./tool";

export type SkillsRuntime = {
	registry: Awaited<ReturnType<typeof createSkillRegistry>>;
	activator: SkillActivator;
	provider: ReturnType<typeof createSkillsToolProvider>;
};

export async function createSkillsRuntime(input: {
	projectRoot: string;
	allowProjectSkills: boolean;
	userSkillRoot?: string;
}): Promise<SkillsRuntime> {
	const projectRoot = resolve(input.projectRoot);
	const userRoot = resolve(
		input.userSkillRoot ?? `${homedir()}/.agents/skills`,
	);

	const registry = await createSkillRegistry({
		projectRoots: [resolve(projectRoot, "skills")],
		userRoots: [userRoot],
		allowProjectSkills: input.allowProjectSkills,
		allowedRoots: [resolve(projectRoot, "skills"), userRoot],
		reservedNames: ["activate_skill"],
	});
	const activator = new SkillActivator({ registry });

	return {
		registry,
		activator,
		provider: createSkillsToolProvider({ activator }),
	};
}
