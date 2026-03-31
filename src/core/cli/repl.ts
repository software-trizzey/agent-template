import { stdin as input, stdout as output } from "node:process";
import { createInterface } from "node:readline/promises";

export type ReplCommand =
	| { type: "help" }
	| { type: "reset" }
	| { type: "exit" }
	| { type: "prompt"; value: string };

function parseCommand(value: string): ReplCommand {
	if (value === "/help") {
		return { type: "help" };
	}

	if (value === "/reset") {
		return { type: "reset" };
	}

	if (value === "/exit") {
		return { type: "exit" };
	}

	return {
		type: "prompt",
		value,
	};
}

export async function runRepl(inputHandler: {
	onPrompt: (value: string) => Promise<string>;
	onReset: () => Promise<void>;
	onHelp: () => string;
}): Promise<void> {
	const rl = createInterface({
		input,
		output,
		terminal: true,
	});

	try {
		let isRunning = true;
		while (isRunning) {
			const raw = await rl.question("> ");
			const value = raw.trim();

			if (value.length === 0) {
				continue;
			}

			const command = parseCommand(value);
			if (command.type === "help") {
				output.write(`${inputHandler.onHelp()}\n`);
				continue;
			}

			if (command.type === "reset") {
				await inputHandler.onReset();
				output.write("Session reset.\n");
				continue;
			}

			if (command.type === "exit") {
				isRunning = false;
				continue;
			}

			const assistantOutput = await inputHandler.onPrompt(command.value);
			output.write(`${assistantOutput}\n`);
		}
	} finally {
		rl.close();
	}
}
