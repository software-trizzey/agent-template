import { HStack, type Node, Text, TextInput, VStack } from "@cel-tui/core";
import type { ReplUiState, TranscriptRow } from "../../types";

type CelReplViewInput = {
	state: ReplUiState;
	inputValue: string;
	onInputChange: (value: string) => void;
	onSubmit: () => void;
	onExit: () => void;
};

function formatTranscriptRow(row: TranscriptRow): {
	label: string;
	text: string;
	fgColor: "color01" | "color02" | "color04" | "color06" | "color08";
} {
	if (row.kind === "user") {
		return {
			label: "you",
			text: row.text,
			fgColor: "color06",
		};
	}

	if (row.kind === "assistant") {
		return {
			label: "assistant",
			text: row.text,
			fgColor: "color02",
		};
	}

	if (row.kind === "activity") {
		return {
			label: "activity",
			text: row.text,
			fgColor: "color08",
		};
	}

	if (row.kind === "error") {
		return {
			label: "error",
			text: row.text,
			fgColor: "color01",
		};
	}

	return {
		label: "system",
		text: row.text,
		fgColor: "color04",
	};
}

export function createCelReplView(input: CelReplViewInput): Node {
	const transcriptNodes = input.state.transcript.map((row) => {
		const view = formatTranscriptRow(row);
		return Text(`${view.label}> ${view.text}`, {
			wrap: "word",
			fgColor: view.fgColor,
		});
	});

	const status = input.state.isBusy ? "running" : "idle";

	return VStack(
		{
			height: "100%",
			padding: { x: 1, y: 0 },
			onKeyPress: (key) => {
				if (key === "ctrl+q" || key === "ctrl+c") {
					input.onExit();
					return;
				}

				return false;
			},
		},
		[
			HStack({ justifyContent: "space-between" }, [
				Text("agent-template repl", { bold: true, fgColor: "color14" }),
				Text(`status: ${status}`, { fgColor: "color08" }),
			]),
			Text("-", { repeat: "fill", fgColor: "color08" }),
			VStack(
				{
					flex: 1,
					overflow: "scroll",
					gap: 1,
				},
				transcriptNodes,
			),
			Text("-", { repeat: "fill", fgColor: "color08" }),
			TextInput({
				value: input.inputValue,
				focused: true,
				onChange(value) {
					input.onInputChange(value);
				},
				onKeyPress(key) {
					if (key === "enter") {
						input.onSubmit();
						return false;
					}

					return;
				},
				placeholder: Text("Type a prompt or /help", { fgColor: "color08" }),
			}),
		],
	);
}
