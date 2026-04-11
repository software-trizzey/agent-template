import { describe, expect, test } from "bun:test";
import { reduceReplState } from "../../src/core/cli/repl/reducer";
import {
	createInitialReplUiState,
	type ReplEvent,
	type ReplUiState,
} from "../../src/core/cli/repl/types";

function reduceEvents(events: ReplEvent[]): ReplUiState {
	let state = createInitialReplUiState();
	for (const event of events) {
		state = reduceReplState(state, event);
	}

	return state;
}

describe("reduceReplState", () => {
	test("handles prompt lifecycle and deterministic ordering", () => {
		const state = reduceEvents([
			{
				type: "prompt_submitted",
				prompt: "hello",
			},
			{ type: "prompt_started" },
			{
				type: "activity_received",
				event: { type: "turn_started", turn: 1 },
				text: "[turn 1] started",
			},
			{
				type: "prompt_succeeded",
				output: "world",
			},
		]);

		expect(state.isBusy).toBe(false);
		expect(state.transcript.map((row) => row.kind)).toEqual([
			"user",
			"activity",
			"assistant",
		]);
		expect(state.transcript[0]?.text).toBe("hello");
		expect(state.transcript[2]?.text).toBe("world");
	});

	test("handles prompt failure and reset", () => {
		const failedState = reduceEvents([
			{ type: "prompt_started" },
			{
				type: "prompt_failed",
				message: "boom",
			},
		]);

		expect(failedState.isBusy).toBe(false);
		expect(failedState.transcript.at(-1)).toEqual({
			kind: "error",
			text: "boom",
		});

		const resetState = reduceReplState(failedState, { type: "session_reset" });
		expect(resetState.transcript).toEqual([]);
		expect(resetState.isBusy).toBe(false);
	});

	test("maps system rows and exit lifecycle events", () => {
		const state = reduceEvents([
			{
				type: "system_message",
				text: "Commands:",
			},
			{
				type: "prompt_started",
			},
			{
				type: "prompt_succeeded",
				output: "",
			},
			{ type: "exit_requested" },
		]);

		expect(state.isBusy).toBe(false);
		expect(state.isRunning).toBe(false);
		expect(state.transcript).toEqual([{ kind: "system", text: "Commands:" }]);
	});
});
