import { evaluatePolicies } from "../policies/policyChain";
import { ToolExecutionResultSchema } from "../schemas/tools";
import type { ToolPolicy } from "../types/policy";
import type { ToolExecutionResult, ToolRegistry } from "../types/tools";
import { validateToolArgsObject } from "./args";
import { toToolResultFailure } from "./result";

export async function executeToolCall(input: {
	registry: ToolRegistry;
	policies: ToolPolicy[];
	toolName: string;
	args: unknown;
	context: unknown;
}): Promise<ToolExecutionResult> {
	const invalidArgs = validateToolArgsObject(input.args);
	if (invalidArgs !== null) {
		return invalidArgs;
	}

	const tool = input.registry.resolve(input.toolName);
	if (tool === null) {
		return toToolResultFailure(
			"TOOL_NOT_FOUND",
			`Unknown tool: ${input.toolName}`,
		);
	}

	const policyFailure = await evaluatePolicies(input.policies, {
		toolName: input.toolName,
		args: input.args,
		context: input.context,
	});
	if (policyFailure !== null) {
		return policyFailure;
	}

	try {
		const result = await tool.execute(input.args, input.context);
		const parsedResult = ToolExecutionResultSchema.safeParse(result);
		if (!parsedResult.success) {
			return toToolResultFailure(
				"TOOL_EXECUTION_ERROR",
				"Tool returned an invalid execution result",
			);
		}

		return parsedResult.data;
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		return toToolResultFailure("TOOL_EXECUTION_ERROR", message);
	}
}
