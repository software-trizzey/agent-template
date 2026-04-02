import type { SessionMessage } from "../types/model";

export type NormalizedObjectToolSchema = Record<string, unknown> & {
	type: "object";
	properties: Record<string, unknown>;
	required: string[];
};

export function isRecord(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function normalizeObjectToolSchema(
	schema: Record<string, unknown>,
): NormalizedObjectToolSchema {
	const normalized: Record<string, unknown> = {
		...schema,
	};

	normalized.type = "object";
	normalized.properties = isRecord(normalized.properties)
		? normalized.properties
		: {};
	normalized.required = Array.isArray(normalized.required)
		? normalized.required.filter(
				(value): value is string => typeof value === "string",
			)
		: [];

	return normalized as NormalizedObjectToolSchema;
}

export function parseJsonStringOrRaw(input: string): unknown {
	try {
		return JSON.parse(input);
	} catch {
		return input;
	}
}

export function stringifyJsonOrFallback(input: unknown): string {
	if (typeof input === "string") {
		return input;
	}

	try {
		return JSON.stringify(input);
	} catch {
		return String(input);
	}
}

export function shouldDebugModelIo(): boolean {
	const value = process.env.DEBUG_MODEL_IO;
	if (value === undefined) {
		return false;
	}

	const normalized = value.trim().toLowerCase();
	if (normalized.length === 0) {
		return false;
	}

	return normalized !== "0" && normalized !== "false";
}

export function debugModelIo(provider: string, message: string): void {
	if (!shouldDebugModelIo()) {
		return;
	}

	console.debug(`[model-io:${provider}] ${message}`);
}

export function findUnmatchedToolOutputCallIds(
	history: SessionMessage[],
): string[] {
	const knownCallIds = new Set<string>();
	const unmatchedOutputIds = new Set<string>();

	for (const message of history) {
		if (
			message.role === "assistant" &&
			message.toolCall !== undefined &&
			message.toolCall.id.length > 0
		) {
			knownCallIds.add(message.toolCall.id);
		}

		if (
			message.role === "tool" &&
			typeof message.name === "string" &&
			message.name.length > 0 &&
			!knownCallIds.has(message.name)
		) {
			unmatchedOutputIds.add(message.name);
		}
	}

	return [...unmatchedOutputIds];
}

export function hideAssistantTextWhenToolCalled(input: {
	assistantText: string | null;
	hasToolCall: boolean;
}): string | null {
	return input.hasToolCall ? null : input.assistantText;
}
