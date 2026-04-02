import type { ActivityEvent } from "../types/activity";

export function formatActivityEvent(event: ActivityEvent): string {
	if (event.type === "turn_started") {
		return `[turn ${event.turn}] started`;
	}

	if (event.type === "turn_finished") {
		return `[turn ${event.turn}] finished`;
	}

	if (event.type === "tool_started") {
		const callIdSuffix =
			event.callId === undefined ? "" : ` call_id=${event.callId}`;
		return `[turn ${event.turn}] tool started: ${event.toolName}${callIdSuffix}`;
	}

	if (event.ok) {
		const callIdSuffix =
			event.callId === undefined ? "" : ` call_id=${event.callId}`;
		return `[turn ${event.turn}] tool finished: ${event.toolName} (ok${callIdSuffix})`;
	}

	const callIdSuffix =
		event.callId === undefined ? "" : ` call_id=${event.callId}`;
	const codeSuffix = event.code === null ? "" : ` code=${event.code}`;
	const messageSuffix =
		event.message === undefined || event.message === null
			? ""
			: ` message=${event.message}`;
	return `[turn ${event.turn}] tool finished: ${event.toolName} (failed${callIdSuffix}${codeSuffix}${messageSuffix})`;
}
