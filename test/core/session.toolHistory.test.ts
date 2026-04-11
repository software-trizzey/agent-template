import { describe, expect, test } from "bun:test";
import { appendToolHistoryPair } from "../../src/core/session/toolHistory";
import type { SessionMessage } from "../../src/core/types";

describe("appendToolHistoryPair", () => {
	test("injects assistant tool call followed by tool result", () => {
		const history: SessionMessage[] = [];
		appendToolHistoryPair({
			history,
			toolName: "activate_skill",
			args: { name: "writer" },
			result: { ok: true, data: { name: "writer" } },
			callId: "call_123",
		});

		expect(history).toHaveLength(2);
		expect(history[0]?.role).toBe("assistant");
		expect(history[0]?.toolCall?.id).toBe("call_123");
		expect(history[1]?.role).toBe("tool");
		expect(history[1]?.name).toBe("call_123");
	});
});
