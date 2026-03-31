import type { ActivityEvent } from "../types/activity";

export function formatActivityEvent(event: ActivityEvent): string {
	if (event.type === "turn_started") {
		return `[turn ${event.turn}] started`;
	}

	if (event.type === "turn_finished") {
		return `[turn ${event.turn}] finished`;
	}

	if (event.type === "tool_started") {
		return `[turn ${event.turn}] tool started: ${event.toolName}`;
	}

	if (event.ok) {
		return `[turn ${event.turn}] tool finished: ${event.toolName} (ok)`;
	}

	const codeSuffix = event.code === null ? "" : ` code=${event.code}`;
	return `[turn ${event.turn}] tool finished: ${event.toolName} (failed${codeSuffix})`;
}
