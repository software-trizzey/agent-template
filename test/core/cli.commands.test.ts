import { describe, expect, test } from "bun:test";
import { resolveReplCommand } from "../../src/core/cli/commands";

describe("resolveReplCommand", () => {
	test("keeps built-in command precedence", () => {
		const command = resolveReplCommand({
			raw: "/help",
			availableSkillNames: ["help"],
		});

		expect(command.type).toBe("help");
	});

	test("parses canonical skill command", () => {
		const command = resolveReplCommand({
			raw: "/skill writer",
			availableSkillNames: [],
		});

		expect(command).toEqual({
			type: "skill_activate",
			name: "writer",
		});
	});

	test("parses direct alias for known skill", () => {
		const command = resolveReplCommand({
			raw: "/writer",
			availableSkillNames: ["writer"],
		});

		expect(command).toEqual({
			type: "skill_activate",
			name: "writer",
		});
	});

	test("returns unknown_slash for unknown aliases with suggestions", () => {
		const command = resolveReplCommand({
			raw: "/writr",
			availableSkillNames: ["writer"],
		});

		expect(command.type).toBe("unknown_slash");
		if (command.type !== "unknown_slash") {
			return;
		}

		expect(
			command.suggestions.some((suggestion) => suggestion.includes("writer")),
		).toBe(true);
	});

	test("returns skills listing command", () => {
		const command = resolveReplCommand({
			raw: "/skills",
			availableSkillNames: [],
		});

		expect(command.type).toBe("skills_list");
	});
});
