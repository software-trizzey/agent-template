import {
	ToolPolicyDecisionSchema,
	ToolPolicyInputSchema,
} from "../schemas/policy";
import { toToolResultFailure } from "../tools/result";
import type { ToolPolicy, ToolPolicyInput } from "../types/policy";
import type { ToolExecutionFailure } from "../types/tools";

export async function evaluatePolicies(
	policies: ToolPolicy[],
	input: ToolPolicyInput,
): Promise<ToolExecutionFailure | null> {
	const parsedInput = ToolPolicyInputSchema.parse(input);

	for (const policy of policies) {
		const decisionResult = ToolPolicyDecisionSchema.safeParse(
			await policy.evaluate(parsedInput),
		);
		if (!decisionResult.success) {
			return toToolResultFailure(
				"TOOL_EXECUTION_ERROR",
				"Tool policy returned an invalid decision",
			);
		}

		const decision = decisionResult.data;
		if (!decision.allow) {
			return toToolResultFailure(decision.code, decision.reason);
		}
	}

	return null;
}
