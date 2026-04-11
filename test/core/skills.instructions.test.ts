import { describe, expect, test } from "bun:test";
import { composeInstructions } from "../../src/core/skills/instructions";

describe("composeInstructions", () => {
	test("returns base instructions when no skills are available", () => {
		const result = composeInstructions({
			baseInstructions: "Be concise.",
			availableSkillsCatalog: [],
		});

		expect(result).toBe("Be concise.");
	});

	test("injects available_skills block when catalog is present", () => {
		const result = composeInstructions({
			baseInstructions: "Be concise.",
			availableSkillsCatalog: [
				{
					name: "writer",
					description: "Writes docs",
					location: "/tmp/writer/SKILL.md",
				},
			],
		});

		expect(result).toContain("<available_skills>");
		expect(result).toContain("<name>writer</name>");
		expect(result).toContain("<description>Writes docs</description>");
		expect(result).toContain("</available_skills>");
	});
});
