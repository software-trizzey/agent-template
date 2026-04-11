import { describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { createSkillRegistry } from "../../src/core/skills/registry";

async function writeSkillFile(input: {
	root: string;
	relativeDir: string;
	name: string;
	description: string;
	body?: string;
}): Promise<string> {
	const skillDir = join(input.root, input.relativeDir);
	await mkdir(skillDir, { recursive: true });
	const skillPath = join(skillDir, "SKILL.md");
	await Bun.write(
		skillPath,
		[
			"---",
			`name: ${input.name}`,
			`description: ${input.description}`,
			"---",
			input.body ?? "Skill body",
		].join("\n"),
	);
	return skillPath;
}

async function createTempDir(): Promise<string> {
	const dir = join("/tmp", `agent-template-skills-${randomUUID()}`);
	await mkdir(dir, { recursive: true });
	return dir;
}

describe("skills registry", () => {
	test("discovers skills with deterministic order and catalog shape", async () => {
		const projectRoot = await createTempDir();
		await writeSkillFile({
			root: projectRoot,
			relativeDir: "b-skill",
			name: "beta",
			description: "Beta",
		});
		await writeSkillFile({
			root: projectRoot,
			relativeDir: "a-skill",
			name: "alpha",
			description: "Alpha",
		});

		const registry = await createSkillRegistry({
			projectRoots: [projectRoot],
			userRoots: [],
			allowProjectSkills: true,
			allowedRoots: [projectRoot],
			reservedNames: [],
		});

		expect(registry.listCatalog()).toEqual([
			{
				name: "alpha",
				description: "Alpha",
				location: join(projectRoot, "a-skill", "SKILL.md"),
			},
			{
				name: "beta",
				description: "Beta",
				location: join(projectRoot, "b-skill", "SKILL.md"),
			},
		]);
	});

	test("keeps first same-scope duplicate and warns", async () => {
		const projectRoot = await createTempDir();
		await writeSkillFile({
			root: projectRoot,
			relativeDir: "a-first",
			name: "shared",
			description: "First",
		});
		await writeSkillFile({
			root: projectRoot,
			relativeDir: "z-second",
			name: "shared",
			description: "Second",
		});

		const registry = await createSkillRegistry({
			projectRoots: [projectRoot],
			userRoots: [],
			allowProjectSkills: true,
			allowedRoots: [projectRoot],
			reservedNames: [],
		});

		expect(registry.lookupByName("shared")?.description).toBe("First");
		expect(
			registry.warnings.some(
				(warning) => warning.code === "SKILL_DUPLICATE_NAME",
			),
		).toBe(true);
	});

	test("project scope overrides user scope for same name", async () => {
		const projectRoot = await createTempDir();
		const userRoot = await createTempDir();
		await writeSkillFile({
			root: projectRoot,
			relativeDir: "project-skill",
			name: "shared",
			description: "Project version",
		});
		await writeSkillFile({
			root: userRoot,
			relativeDir: "user-skill",
			name: "shared",
			description: "User version",
		});

		const registry = await createSkillRegistry({
			projectRoots: [projectRoot],
			userRoots: [userRoot],
			allowProjectSkills: true,
			allowedRoots: [projectRoot, userRoot],
			reservedNames: [],
		});

		expect(registry.lookupByName("shared")?.description).toBe(
			"Project version",
		);
	});

	test("skips reserved-name conflicts", async () => {
		const projectRoot = await createTempDir();
		await writeSkillFile({
			root: projectRoot,
			relativeDir: "skill",
			name: "activate_skill",
			description: "Conflicting",
		});

		const registry = await createSkillRegistry({
			projectRoots: [projectRoot],
			userRoots: [],
			allowProjectSkills: true,
			allowedRoots: [projectRoot],
			reservedNames: ["activate_skill"],
		});

		expect(registry.lookupByName("activate_skill")).toBeNull();
		expect(
			registry.warnings.some(
				(warning) => warning.code === "SKILL_RESERVED_NAME",
			),
		).toBe(true);
	});

	test("enforces trust-root gating and allowProjectSkills flag", async () => {
		const projectRoot = await createTempDir();
		await writeSkillFile({
			root: projectRoot,
			relativeDir: "skill",
			name: "local_skill",
			description: "Project skill",
		});

		const blockedByTrust = await createSkillRegistry({
			projectRoots: [projectRoot],
			userRoots: [],
			allowProjectSkills: true,
			allowedRoots: [],
			reservedNames: [],
		});
		expect(blockedByTrust.lookupByName("local_skill")).toBeNull();
		expect(
			blockedByTrust.warnings.some(
				(warning) => warning.code === "SKILL_TRUST_ROOT_VIOLATION",
			),
		).toBe(true);

		const blockedByFlag = await createSkillRegistry({
			projectRoots: [projectRoot],
			userRoots: [],
			allowProjectSkills: false,
			allowedRoots: [projectRoot],
			reservedNames: [],
		});
		expect(blockedByFlag.lookupByName("local_skill")).toBeNull();
	});

	test("discovers rich YAML fixture through registry", async () => {
		const fixtureRoot = fileURLToPath(
			new URL("../fixtures/skills/rich-yaml", import.meta.url),
		);
		const registry = await createSkillRegistry({
			projectRoots: [fixtureRoot],
			userRoots: [],
			allowProjectSkills: true,
			allowedRoots: [fixtureRoot],
			reservedNames: [],
		});

		expect(registry.lookupByName("rich_yaml_fixture")?.description).toBe(
			"Rich YAML fixture skill",
		);
	});
});
