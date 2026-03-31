import { describe, expect, test } from "bun:test";
import { parseCliArgs } from "../../src/core/cli/args";

describe("parseCliArgs", () => {
	test("returns repl command with defaults when args are missing", () => {
		const result = parseCliArgs([]);

		expect(result.command).toBe("repl");
		expect(result.model).toBe("openai/gpt-5.3-codex");
		expect(result.maxTurns).toBe(8);
	});

	test("parses run command", () => {
		const result = parseCliArgs(["run", "hello"]);

		expect(result).toEqual({
			command: "run",
			prompt: "hello",
			model: "openai/gpt-5.3-codex",
			maxTurns: 8,
		});
	});

	test("parses supported options on run command", () => {
		const result = parseCliArgs([
			"run",
			"hello",
			"--model",
			"gpt-x",
			"--max-turns",
			"12",
		]);

		expect(result).toEqual({
			command: "run",
			prompt: "hello",
			model: "gpt-x",
			maxTurns: 12,
		});
	});

	test("parses supported options on repl command", () => {
		const result = parseCliArgs(["--model", "gpt-x", "--max-turns", "12"]);

		expect(result).toEqual({
			command: "repl",
			model: "gpt-x",
			maxTurns: 12,
		});
	});

	test("fails when max-turns is invalid", () => {
		expect(() => parseCliArgs(["--max-turns", "0"])).toThrow(
			"--max-turns must be a positive integer.",
		);
	});

	test("fails when run prompt is missing", () => {
		expect(() => parseCliArgs(["run"])).toThrow(
			"missing required args for command `run <prompt>`",
		);
	});

	test("fails when run command receives extra positional args", () => {
		expect(() => parseCliArgs(["run", "Do", "foo", "work"])).toThrow(
			"Unused args: `foo`, `work`",
		);
	});
});
