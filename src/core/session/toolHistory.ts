import type { SessionMessage } from "../types";

export function serializeToolResult(toolName: string, result: unknown): string {
	return JSON.stringify({
		toolName,
		result,
	});
}

export function generateToolCallId(): string {
	return `call_${crypto.randomUUID().replaceAll("-", "")}`;
}

export function appendToolHistoryPair(input: {
	history: SessionMessage[];
	toolName: string;
	args: unknown;
	result: unknown;
	callId?: string;
}): { history: SessionMessage[]; callId: string } {
	const callId = input.callId ?? generateToolCallId();
	input.history.push({
		role: "assistant",
		content: "",
		toolCall: {
			id: callId,
			name: input.toolName,
			args: input.args,
		},
	});
	input.history.push({
		role: "tool",
		name: callId,
		content: serializeToolResult(input.toolName, input.result),
	});

	return {
		history: input.history,
		callId,
	};
}
