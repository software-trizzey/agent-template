import { describe, expect, test } from "bun:test";
import {
	BUILT_IN_COMMAND_LITERALS,
	REPL_COMMAND_CATALOG,
} from "../../src/core/cli/repl/command-catalog";

describe("REPL_COMMAND_CATALOG", () => {
	test("contains canonical commands and aliases", () => {
		expect(REPL_COMMAND_CATALOG.map((command) => command.name)).toEqual([
			"help",
			"reset",
			"skills",
			"skill",
			"exit",
		]);
		expect(BUILT_IN_COMMAND_LITERALS).toEqual([
			"/help",
			"/reset",
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
});
