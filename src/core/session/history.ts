import type { SessionMessage } from "../types/model";

export function cloneHistory(history: SessionMessage[]): SessionMessage[] {
	return [...history];
}

export function appendHistory(
	history: SessionMessage[],
	message: SessionMessage,
): SessionMessage[] {
	history.push(message);
	return history;
}
