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

export function hideAssistantTextWhenToolCalled(input: {
	assistantText: string | null;
	hasToolCall: boolean;
}): string | null {
	return input.hasToolCall ? null : input.assistantText;
}
