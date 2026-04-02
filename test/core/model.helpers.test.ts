import { describe, expect, test } from "bun:test";
import {
	debugModelIo,
	findUnmatchedToolOutputCallIds,
	hideAssistantTextWhenToolCalled,
	normalizeObjectToolSchema,
	parseJsonStringOrRaw,
	shouldDebugModelIo,
	stringifyJsonOrFallback,
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

	test("stringifyJsonOrFallback stringifies non-string inputs", () => {
		expect(stringifyJsonOrFallback({ query: "docs" })).toBe('{"query":"docs"}');
		expect(stringifyJsonOrFallback("raw-value")).toBe("raw-value");
	});

	test("shouldDebugModelIo and debugModelIo are gated by DEBUG_MODEL_IO", () => {
		const previousValue = process.env.DEBUG_MODEL_IO;
		const previousDebug = console.debug;
		const debugLines: string[] = [];

		console.debug = (line: unknown) => {
			debugLines.push(String(line));
		};

		process.env.DEBUG_MODEL_IO = "0";
		expect(shouldDebugModelIo()).toBe(false);
		debugModelIo("openai", "disabled line");
		expect(debugLines).toEqual([]);

		process.env.DEBUG_MODEL_IO = "true";
		expect(shouldDebugModelIo()).toBe(true);
		debugModelIo("openai", "enabled line");
		expect(debugLines).toEqual(["[model-io:openai] enabled line"]);

		if (previousValue === undefined) {
			delete process.env.DEBUG_MODEL_IO;
		} else {
			process.env.DEBUG_MODEL_IO = previousValue;
		}
		console.debug = previousDebug;
	});

	test("findUnmatchedToolOutputCallIds returns dangling tool output ids", () => {
		expect(
			findUnmatchedToolOutputCallIds([
				{
					role: "assistant",
					content: "",
					toolCall: {
						id: "call_matched",
						name: "search_web",
						args: { query: "docs" },
					},
				},
				{
					role: "tool",
					name: "call_missing",
					content: "{}",
				},
				{
					role: "tool",
					name: "call_matched",
					content: "{}",
				},
			]),
		).toEqual(["call_missing"]);
	});
});
