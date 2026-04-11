import type { SkillCatalogEntry } from "./types";

export function composeInstructions(input: {
	baseInstructions: string;
	availableSkillsCatalog: SkillCatalogEntry[];
}): string {
	if (input.availableSkillsCatalog.length === 0) {
		return input.baseInstructions;
	}

	const lines: string[] = [input.baseInstructions, "", "<available_skills>"];

	for (const entry of input.availableSkillsCatalog) {
		lines.push("  <skill>");
		lines.push(`    <name>${entry.name}</name>`);
		lines.push(`    <description>${entry.description}</description>`);
		lines.push(`    <location>${entry.location}</location>`);
		lines.push("  </skill>");
	}

	lines.push("</available_skills>");
	return lines.join("\n");
}
