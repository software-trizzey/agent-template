import { describe, expect, test } from "bun:test";
import {
	hideAssistantTextWhenToolCalled,
	normalizeObjectToolSchema,
	parseJsonStringOrRaw,
} from "../../src/core/model";

describe("model helpers", () => {
	test("normalizeObjectToolSchema enforces object shape", () => {
		const normalized = normalizeObjectToolSchema({
			title: "tool args",
			properties: "invalid",
			required: ["query", 123, "limit"],
		});

		expect(normalized.type).toBe("object");
		expect(normalized.properties).toEqual({});
		expect(normalized.required).toEqual(["query", "limit"]);
		expect(normalized.title).toBe("tool args");
	});

	test("parseJsonStringOrRaw parses valid json and falls back for raw", () => {
		expect(parseJsonStringOrRaw('{"query":"docs"}')).toEqual({
			query: "docs",
		});
		expect(parseJsonStringOrRaw("not-json")).toBe("not-json");
	});

	test("hideAssistantTextWhenToolCalled suppresses text on tool call", () => {
		expect(
			hideAssistantTextWhenToolCalled({
				assistantText: "should be hidden",
				hasToolCall: true,
			}),
		).toBeNull();

		expect(
			hideAssistantTextWhenToolCalled({
				assistantText: "visible",
				hasToolCall: false,
			}),
		).toBe("visible");
	});
});
