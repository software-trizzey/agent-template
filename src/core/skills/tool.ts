import { z } from "zod";
import { toToolResultFailure, toToolResultSuccess } from "../tools/result";
import type { ToolProvider, UnifiedTool } from "../types";
import type { SkillActivator } from "./activator";

const ActivateSkillArgsSchema = z.object({
	name: z.string().trim().min(1),
});

export function createActivateSkillTool(input: {
	activator: SkillActivator;
}): UnifiedTool {
	return {
		descriptor: {
			name: "activate_skill",
			description: "Activates a local skill by name.",
			inputSchemaJson: {
				type: "object",
				properties: {
					name: {
						type: "string",
						description: "Skill name to activate",
					},
				},
				required: ["name"],
				additionalProperties: false,
			},
			provider: "local",
		},
		async execute(args) {
			const parsed = ActivateSkillArgsSchema.safeParse(args);
			if (!parsed.success) {
				return toToolResultFailure(
					"INVALID_TOOL_ARGUMENTS",
					"`activate_skill` requires { name: string }",
				);
			}

			const activated = await input.activator.activate(parsed.data.name);
			if (!activated.ok) {
				return toToolResultFailure(
					"BUSINESS_RULE_VIOLATION",
					activated.message,
				);
			}

			return toToolResultSuccess(activated.data);
		},
	};
}

export function createSkillsToolProvider(input: {
	activator: SkillActivator;
}): ToolProvider {
	const tool = createActivateSkillTool({
		activator: input.activator,
	});

	return {
		async listTools() {
			return [tool];
		},
		async shutdown() {
			return;
		},
	};
}
