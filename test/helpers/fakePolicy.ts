import type {
	ToolPolicy,
	ToolPolicyDecision,
	ToolPolicyInput,
} from "../../src/core/types";

export class FakePolicy implements ToolPolicy {
	private readonly blockedToolNames: Set<string>;

	constructor(blockedToolNames: string[]) {
		this.blockedToolNames = new Set(blockedToolNames);
	}

	async evaluate(input: ToolPolicyInput): Promise<ToolPolicyDecision> {
		if (this.blockedToolNames.has(input.toolName)) {
			return {
				allow: false,
				code: "BUSINESS_RULE_VIOLATION",
				reason: `Tool '${input.toolName}' is blocked by policy`,
			};
		}

		return { allow: true };
	}
}
