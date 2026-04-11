import { describe, expect, test } from "bun:test";
import { parseSkillDocument } from "../../src/core/skills/parser";

describe("skills parser", () => {
	test("parses valid SKILL.md with metadata and body", () => {
		const result = parseSkillDocument({
			content: [
				"---",
				"name: write_blog",
				"description: Writes a blog post",
				"owner: docs-team",
				"---",
				"Use this skill to write posts.",
			].join("\n"),
			sourcePath: "/tmp/SKILL.md",
		});

		expect(result.warnings).toHaveLength(0);
		expect(result.skill).not.toBeNull();
		expect(result.skill?.name).toBe("write_blog");
		expect(result.skill?.description).toBe("Writes a blog post");
		expect(result.skill?.metadata.owner).toBe("docs-team");
		expect(result.skill?.body).toContain("write posts");
	});

	test("returns parse warning when frontmatter is malformed", () => {
		const result = parseSkillDocument({
			content: [
				"---",
				"name write_blog",
				"description: Missing colon above",
				"---",
			].join("\n"),
			sourcePath: "/tmp/SKILL.md",
		});

		expect(result.skill).toBeNull();
		expect(result.warnings[0]?.code).toBe("SKILL_PARSE_ERROR");
		expect(result.warnings[0]?.sourcePath).toBe("/tmp/SKILL.md");
	});

	test("returns required field warning when name or description is missing", () => {
		const result = parseSkillDocument({
			content: ["---", "name: valid_name", "---", "No description"].join("\n"),
		});

		expect(result.skill).toBeNull();
		expect(result.warnings[0]?.code).toBe("SKILL_MISSING_REQUIRED_FIELD");
	});

	test("returns metadata warning when name violates format", () => {
		const result = parseSkillDocument({
			content: ["---", "name: Invalid Name", "description: good", "---"].join(
				"\n",
			),
		});

		expect(result.skill).toBeNull();
		expect(result.warnings[0]?.code).toBe("SKILL_INVALID_METADATA");
	});

	test("returns metadata warning when description exceeds max length", () => {
		const longDescription = "a".repeat(281);
		const result = parseSkillDocument({
			content: [
				"---",
				"name: valid_name",
				`description: ${longDescription}`,
				"---",
			].join("\n"),
		});

		expect(result.skill).toBeNull();
		expect(result.warnings[0]?.code).toBe("SKILL_INVALID_METADATA");
	});

	test("parses rich YAML frontmatter fields and preserves unknown metadata", () => {
		const result = parseSkillDocument({
			content: [
				"---",
				"name: rich_skill",
				'description: "Writes: docs"',
				"tags:",
				"  - docs",
				"  - writing",
				"config:",
				"  mode: strict",
				"notes: |",
				"  line one",
				"  line two",
				"---",
				"Body instructions.",
			].join("\n"),
		});

		expect(result.warnings).toHaveLength(0);
		expect(result.skill).not.toBeNull();
		expect(result.skill?.name).toBe("rich_skill");
		expect(result.skill?.description).toBe("Writes: docs");
		expect(result.skill?.metadata.tags).toEqual(["docs", "writing"]);
		expect(result.skill?.metadata.config).toEqual({ mode: "strict" });
		expect(result.skill?.metadata.notes).toContain("line one");
	});

	test("returns parse warning when frontmatter YAML is invalid", () => {
		const result = parseSkillDocument({
			content: [
				"---",
				"name: broken",
				"description: valid",
				"tags: [unclosed",
				"---",
			].join("\n"),
			sourcePath: "/tmp/invalid-yaml/SKILL.md",
		});

		expect(result.skill).toBeNull();
		expect(result.warnings[0]?.code).toBe("SKILL_PARSE_ERROR");
		expect(result.warnings[0]?.sourcePath).toBe("/tmp/invalid-yaml/SKILL.md");
	});

	test("returns parse warning when frontmatter is valid YAML but not an object", () => {
		const result = parseSkillDocument({
			content: ["---", "- one", "- two", "---", "Body"].join("\n"),
		});

		expect(result.skill).toBeNull();
		expect(result.warnings[0]?.code).toBe("SKILL_PARSE_ERROR");
	});

	test("parses rich frontmatter fixture", async () => {
		const file = Bun.file(
			new URL(
				"../fixtures/skills/rich-yaml/accepted/SKILL.md",
				import.meta.url,
			),
		);
		const content = await file.text();
		const result = parseSkillDocument({ content });

		expect(result.warnings).toHaveLength(0);
		expect(result.skill).not.toBeNull();
		expect(result.skill?.name).toBe("rich_yaml_fixture");
		expect(result.skill?.metadata.tags).toEqual(["parsing", "yaml"]);
		expect(result.skill?.metadata.metadata).toEqual({
			owner: "platform",
			tier: "core",
		});
	});
});
