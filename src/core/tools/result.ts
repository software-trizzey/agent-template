import type {
	ToolExecutionFailure,
	ToolExecutionSuccess,
	ToolFailureCode,
} from "../types/tools";

export function toToolResultSuccess(data: unknown): ToolExecutionSuccess {
	return {
		ok: true,
		data,
	};
}

export function toToolResultFailure(
	code: ToolFailureCode,
	message: string,
): ToolExecutionFailure {
	return {
		ok: false,
		code,
		message,
	};
}
