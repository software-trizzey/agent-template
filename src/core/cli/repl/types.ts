import type { ActivityEvent } from "../../types/activity";

export type TranscriptRow =
	| { kind: "user"; text: string }
	| { kind: "assistant"; text: string }
	| { kind: "activity"; text: string; event: ActivityEvent }
	| {
			kind: "model";
			modelName: string;
			providerName: string;
			isCurrent: boolean;
	  }
	| { kind: "system"; text: string }
	| { kind: "error"; text: string };

export type ReplUiState = {
	transcript: TranscriptRow[];
	isBusy: boolean;
	isRunning: boolean;
	inputValue: string;
};

export type ReplEvent =
	| { type: "prompt_submitted"; prompt: string }
	| { type: "prompt_started" }
	| { type: "activity_received"; event: ActivityEvent; text: string }
	| { type: "prompt_succeeded"; output: string }
	| { type: "prompt_failed"; message: string }
	| { type: "system_message"; text: string }
	| {
			type: "models_listed";
			models: Array<{
				modelName: string;
				providerName: string;
				isCurrent: boolean;
			}>;
	  }
	| { type: "session_reset" }
	| { type: "exit_requested" };

export function createInitialReplUiState(): ReplUiState {
	return {
		transcript: [],
		isBusy: false,
		isRunning: true,
		inputValue: "",
	};
}
