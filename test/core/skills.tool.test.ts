import { describe, expect, test } from "bun:test";
import { SkillActivator } from "../../src/core/skills/activator";
import { createActivateSkillTool } from "../../src/core/skills/tool";
import type { SkillRegistry } from "../../src/core/skills/types";

function createRegistry(): SkillRegistry {
	return {
		listCatalog() {
			return [
				{
					name: "writer",
					description: "Writes",
					location: "/tmp/writer/SKILL.md",
				},
			];
		},
		listSkills() {
			return [
				{
					name: "writer",
					description: "Writes",
					body: "Write things",
					metadata: {
						name: "writer",
						description: "Writes",
					},
					scope: "project",
					skillFilePath: "/tmp/writer/SKILL.md",
					skillDirectoryPath: "/tmp/writer",
				},
			];
		},
		lookupByName(name) {
			if (name !== "writer") {
				return null;
			}

			return this.listSkills()[0] ?? null;
		},
		warnings: [],
	};
}

describe("activate_skill tool adapter", () => {
	test("provides expected descriptor", () => {
		const activator = new SkillActivator({ registry: createRegistry() });
		const tool = createActivateSkillTool({ activator });

		expect(tool.descriptor.name).toBe("activate_skill");
		expect(tool.descriptor.provider).toBe("local");
	});

	test("validates arguments", async () => {
		const activator = new SkillActivator({ registry: createRegistry() });
		const tool = createActivateSkillTool({ activator });

		const result = await tool.execute({ foo: "bar" }, {});
		expect(result.ok).toBe(false);
		if (result.ok) {
			return;
		}

		expect(result.code).toBe("INVALID_TOOL_ARGUMENTS");
	});

	test("returns success envelope for known skill", async () => {
		const activator = new SkillActivator({ registry: createRegistry() });
		const tool = createActivateSkillTool({ activator });

		const result = await tool.execute({ name: "writer" }, {});
		expect(result.ok).toBe(true);
	});

	test("returns failure envelope for unknown skill", async () => {
		const activator = new SkillActivator({ registry: createRegistry() });
		const tool = createActivateSkillTool({ activator });

		const result = await tool.execute({ name: "missing" }, {});
		expect(result.ok).toBe(false);
		if (result.ok) {
			return;
		}

		expect(result.code).toBe("BUSINESS_RULE_VIOLATION");
		expect(result.message).toContain("Unknown skill");
	});
});
