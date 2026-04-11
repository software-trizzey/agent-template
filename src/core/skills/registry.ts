import { resolve } from "node:path";
import { parseSkillDocument } from "./parser";
import type {
	DiscoveredSkill,
	SkillCatalogEntry,
	SkillRegistry,
	SkillRegistryOptions,
	SkillScope,
	SkillWarning,
} from "./types";

async function scanSkillFiles(root: string): Promise<string[]> {
	const skillFiles: string[] = [];
	const pattern = new Bun.Glob("**/SKILL.md");
	for await (const relativePath of pattern.scan({ cwd: root })) {
		skillFiles.push(resolve(root, relativePath));
	}

	skillFiles.sort((left, right) => left.localeCompare(right));
	return skillFiles;
}

function toWarning(
	code: SkillWarning["code"],
	message: string,
	sourcePath?: string,
): SkillWarning {
	return {
		code,
		message,
		sourcePath,
	};
}

function normalizeRoots(roots: string[]): string[] {
	return roots
		.map((root) => resolve(root))
		.filter((root, index, values) => values.indexOf(root) === index)
		.sort((left, right) => left.localeCompare(right));
}

function isInsideAllowedRoots(path: string, allowedRoots: string[]): boolean {
	const normalized = resolve(path);
	for (const root of allowedRoots) {
		if (normalized === root || normalized.startsWith(`${root}/`)) {
			return true;
		}
	}

	return false;
}

async function discoverByScope(input: {
	roots: string[];
	scope: SkillScope;
	allowedRoots: string[];
}): Promise<{ skills: DiscoveredSkill[]; warnings: SkillWarning[] }> {
	const warnings: SkillWarning[] = [];
	const discovered: DiscoveredSkill[] = [];

	for (const root of input.roots) {
		if (!isInsideAllowedRoots(root, input.allowedRoots)) {
			warnings.push(
				toWarning(
					"SKILL_TRUST_ROOT_VIOLATION",
					`Skipping root outside allowed set: ${root}`,
					root,
				),
			);
			continue;
		}

		let discoveredSkillFiles: string[] = [];
		try {
			discoveredSkillFiles = await scanSkillFiles(root);
		} catch {
			continue;
		}

		for (const skillFilePath of discoveredSkillFiles) {
			const content = await Bun.file(skillFilePath).text();
			const parsed = parseSkillDocument({
				content,
				sourcePath: skillFilePath,
			});
			warnings.push(...parsed.warnings);
			if (parsed.skill === null) {
				continue;
			}

			discovered.push({
				...parsed.skill,
				scope: input.scope,
				skillFilePath,
				skillDirectoryPath: resolve(skillFilePath, ".."),
			});
		}
	}

	return {
		skills: discovered,
		warnings,
	};
}

export async function createSkillRegistry(
	options: SkillRegistryOptions,
): Promise<SkillRegistry> {
	const warnings: SkillWarning[] = [];
	const allowedRoots = normalizeRoots(options.allowedRoots);
	const projectRoots = options.allowProjectSkills
		? normalizeRoots(options.projectRoots)
		: [];
	const userRoots = normalizeRoots(options.userRoots);

	const projectDiscovery = await discoverByScope({
		roots: projectRoots,
		scope: "project",
		allowedRoots,
	});
	const userDiscovery = await discoverByScope({
		roots: userRoots,
		scope: "user",
		allowedRoots,
	});

	warnings.push(...projectDiscovery.warnings, ...userDiscovery.warnings);

	const reserved = new Set(options.reservedNames);
	const index = new Map<string, DiscoveredSkill>();
	const ordered = [...projectDiscovery.skills, ...userDiscovery.skills];

	for (const skill of ordered) {
		if (reserved.has(skill.name)) {
			warnings.push(
				toWarning(
					"SKILL_RESERVED_NAME",
					`Skipping skill with reserved name: ${skill.name}`,
					skill.skillFilePath,
				),
			);
			continue;
		}

		if (index.has(skill.name)) {
			warnings.push(
				toWarning(
					"SKILL_DUPLICATE_NAME",
					`Skipping duplicate skill name: ${skill.name}`,
					skill.skillFilePath,
				),
			);
			continue;
		}

		index.set(skill.name, skill);
	}

	const entries = Array.from(index.values());
	entries.sort((left, right) => left.name.localeCompare(right.name));

	const catalog: SkillCatalogEntry[] = entries.map((skill) => ({
		name: skill.name,
		description: skill.description,
		location: skill.skillFilePath,
	}));

	return {
		listCatalog(): SkillCatalogEntry[] {
			return [...catalog];
		},
		listSkills(): DiscoveredSkill[] {
			return [...entries];
		},
		lookupByName(name: string): DiscoveredSkill | null {
			return index.get(name) ?? null;
		},
		warnings,
	};
}
