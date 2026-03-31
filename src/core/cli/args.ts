import { cac } from "cac";

const DEFAULT_MODEL = "openai/gpt-5.3-codex";
const DEFAULT_MAX_TURNS = 8;

export type CliInvocation =
	| {
			command: "repl";
			model: string;
			maxTurns: number;
	  }
	| {
			command: "run";
			prompt: string;
			model: string;
			maxTurns: number;
	  };

function normalizeModel(value: unknown): string {
	if (typeof value !== "string") {
		throw new Error("--model must be a string.");
	}

	const model = value.trim();
	if (model.length === 0) {
		throw new Error("--model cannot be empty.");
	}

	return model;
}

function normalizeMaxTurns(value: unknown): number {
	if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) {
		throw new Error("--max-turns must be a positive integer.");
	}

	return value;
}

function parseOptions(options: { model: unknown; maxTurns: unknown }): {
	model: string;
	maxTurns: number;
} {
	return {
		model: normalizeModel(options.model),
		maxTurns: normalizeMaxTurns(options.maxTurns),
	};
}

export function parseCliArgs(argv: string[]): CliInvocation {
	const cli = cac("agent-template");
	let invocation: CliInvocation | null = null;

	cli.option("--model <provider/model>", "model id", {
		default: DEFAULT_MODEL,
	});
	cli.option("--max-turns <n>", "session turn cap", {
		default: DEFAULT_MAX_TURNS,
	});

	cli
		.command("run <prompt>", "Run a one-shot prompt")
		.action(
			(prompt: string, options: { model: unknown; maxTurns: unknown }) => {
				if (prompt.trim().length === 0) {
					throw new Error("run <prompt> requires a non-empty prompt.");
				}

				invocation = {
					command: "run",
					prompt,
					...parseOptions(options),
				};
			},
		);

	cli
		.command("", "Start interactive REPL")
		.action((options: { model: unknown; maxTurns: unknown }) => {
			invocation = {
				command: "repl",
				...parseOptions(options),
			};
		});

	cli.parse(["bun", "src/index.ts", ...argv], { run: true });

	if (invocation === null) {
		throw new Error("Unable to determine CLI command.");
	}

	return invocation;
}
