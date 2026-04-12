import { describe, expect, test } from "bun:test";
import {
	BUILT_IN_COMMAND_LITERALS,
	formatReplHelpLines,
	REPL_COMMAND_CATALOG,
} from "../../src/core/cli/repl/command-catalog";

describe("REPL_COMMAND_CATALOG", () => {
	test("contains canonical commands and aliases", () => {
		expect(REPL_COMMAND_CATALOG.map((command) => command.name)).toEqual([
			"help",
			"reset",
			"models",
			"skills",
			"skill",
			"exit",
		]);
		expect(BUILT_IN_COMMAND_LITERALS).toEqual([
			"/help",
			"/reset",
			"/models",
			"/skills",
			"/skill",
			"/exit",
			":q",
		]);
	});

	test("enforces argument shape metadata for built-ins", () => {
		const skillCommand = REPL_COMMAND_CATALOG.find(
			(command) => command.name === "skill",
		);
		const helpCommand = REPL_COMMAND_CATALOG.find(
			(command) => command.name === "help",
		);

		expect(skillCommand?.argumentShape).toBe("required_name");
		expect(helpCommand?.argumentShape).toBe("none");
	});

	test("includes /models in formatted help lines", () => {
		const lines = formatReplHelpLines();
		expect(lines.some((line) => line.includes("/models"))).toBe(true);
	});
});
