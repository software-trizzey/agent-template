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
				callId: "call_abc123",
			}),
		).toBe("[turn 2] tool started: search_web call_id=call_abc123");

		expect(
			formatActivityEvent({
				type: "tool_finished",
				turn: 2,
				toolName: "search_web",
				callId: "call_abc123",
				ok: true,
				code: null,
			}),
		).toBe("[turn 2] tool finished: search_web (ok call_id=call_abc123)");

		expect(
			formatActivityEvent({
				type: "tool_finished",
				turn: 2,
				toolName: "search_web",
				callId: "call_abc123",
				ok: false,
				code: "INVALID_TOOL_ARGUMENTS",
				message: "query is required",
			}),
		).toBe(
			"[turn 2] tool finished: search_web (failed call_id=call_abc123 code=INVALID_TOOL_ARGUMENTS message=query is required)",
		);
	});
});
