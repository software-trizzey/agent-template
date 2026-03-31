import type { ToolPolicyDecision, ToolPolicyInput } from "../schemas/policy";
import type { ToolExecutionFailure } from "./tools";

export type { ToolPolicyDecision, ToolPolicyInput };

export type ToolPolicy = {
	evaluate: (input: ToolPolicyInput) => Promise<ToolPolicyDecision>;
};

export type PolicyFailure = ToolExecutionFailure;
