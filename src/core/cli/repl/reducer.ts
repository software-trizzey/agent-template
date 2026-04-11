import type { ReplEvent, ReplUiState, TranscriptRow } from "./types";

function appendRow(state: ReplUiState, row: TranscriptRow): ReplUiState {
	return {
		...state,
		transcript: [...state.transcript, row],
	};
}

function withBusyFlag(state: ReplUiState, isBusy: boolean): ReplUiState {
	return {
		...state,
		isBusy,
	};
}

function toTranscriptRow(event: ReplEvent): TranscriptRow | null {
	if (event.type === "prompt_submitted") {
		return { kind: "user", text: event.prompt };
	}

	if (event.type === "activity_received") {
		return {
			kind: "activity",
			text: event.text,
			event: event.event,
		};
	}

	if (event.type === "prompt_succeeded") {
		if (event.output.length === 0) {
			return null;
		}

		return { kind: "assistant", text: event.output };
	}

	if (event.type === "prompt_failed") {
		return { kind: "error", text: event.message };
	}

	if (event.type === "system_message") {
		return { kind: "system", text: event.text };
	}

	return null;
}

export function reduceReplState(
	state: ReplUiState,
	event: ReplEvent,
): ReplUiState {
	if (event.type === "prompt_submitted" || event.type === "activity_received") {
		const row = toTranscriptRow(event);
		if (row === null) {
			return state;
		}

		return appendRow(state, row);
	}

	if (event.type === "prompt_started") {
		return withBusyFlag(state, true);
	}

	if (event.type === "prompt_succeeded") {
		const row = toTranscriptRow(event);
		const nextState = withBusyFlag(state, false);
		if (row === null) {
			return nextState;
		}

		return appendRow(nextState, row);
	}

	if (event.type === "prompt_failed") {
		const row = toTranscriptRow(event);
		if (row === null) {
			return withBusyFlag(state, false);
		}

		return appendRow(withBusyFlag(state, false), row);
	}

	if (event.type === "session_reset") {
		return {
			...state,
			transcript: [],
			isBusy: false,
		};
	}

	if (event.type === "system_message") {
		const row = toTranscriptRow(event);
		if (row === null) {
			return state;
		}

		return appendRow(state, row);
	}

	return {
		...state,
		isRunning: false,
	};
}
