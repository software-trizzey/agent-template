import { describe, expect, test } from "bun:test";
import { formatActivityEvent } from "../../src/core/cli/output";

describe("formatActivityEvent", () => {
	test("formats turn events", () => {
		expect(formatActivityEvent({ type: "turn_started", turn: 1 })).toBe(
			"[turn 1] started",
		);
		expect(formatActivityEvent({ type: "turn_finished", turn: 1 })).toBe(
			"[turn 1] finished",
		);
	});

	test("formats tool events", () => {
		expect(
			formatActivityEvent({
				type: "tool_started",
				turn: 2,
				toolName: "search_web",
			}),
		).toBe("[turn 2] tool started: search_web");

		expect(
			formatActivityEvent({
				type: "tool_finished",
				turn: 2,
				toolName: "search_web",
				ok: true,
				code: null,
			}),
		).toBe("[turn 2] tool finished: search_web (ok)");

		expect(
			formatActivityEvent({
				type: "tool_finished",
				turn: 2,
				toolName: "search_web",
				ok: false,
				code: "INVALID_TOOL_ARGUMENTS",
			}),
		).toBe(
			"[turn 2] tool finished: search_web (failed code=INVALID_TOOL_ARGUMENTS)",
		);
	});
});
