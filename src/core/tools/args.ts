import { ToolArgumentsObjectSchema } from "../schemas/tools";
import type { ToolExecutionFailure } from "../types/tools";
import { toToolResultFailure } from "./result";

export function validateToolArgsObject(
	args: unknown,
): ToolExecutionFailure | null {
	const parsed = ToolArgumentsObjectSchema.safeParse(args);
	if (!parsed.success) {
		return toToolResultFailure(
			"INVALID_TOOL_ARGUMENTS",
			"Tool arguments must be a JSON object",
		);
	}

	return null;
}
