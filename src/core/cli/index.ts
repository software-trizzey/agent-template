import type { SessionMessage } from "../types/model";
import type { CliInvocation } from "./args";
import { runRepl } from "./repl";

export async function runCli(input: {
	args: CliInvocation;
	runPrompt: (
		prompt: string,
		history: SessionMessage[],
	) => Promise<{ output: string; history: SessionMessage[] }>;
}): Promise<void> {
	const history: SessionMessage[] = [];
	const handlePrompt = async (prompt: string): Promise<string> => {
		const result = await input.runPrompt(prompt, history);
		history.splice(0, history.length, ...result.history);
		return result.output;
	};

	if (input.args.command === "run") {
		const output = await handlePrompt(input.args.prompt);
		process.stdout.write(`${output}\n`);
		return;
	}

	await runRepl({
		onPrompt: handlePrompt,
		async onReset(): Promise<void> {
			history.splice(0, history.length);
		},
		onHelp(): string {
			return [
				"Commands:",
				"  /help  Show available commands",
				"  /reset Clear session history",
				"  /exit, :q  Exit the REPL",
			].join("\n");
		},
	});
}
