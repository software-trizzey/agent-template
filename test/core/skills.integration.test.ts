import { describe, expect, test } from "bun:test";
import { createSessionRunner } from "../../src/core/session";
import { appendToolHistoryPair } from "../../src/core/session/toolHistory";
import { SkillActivator } from "../../src/core/skills/activator";
import { createActivateSkillTool } from "../../src/core/skills/tool";
import type { SkillRegistry } from "../../src/core/skills/types";
import { buildToolRegistry } from "../../src/core/tools/registry";
import { toToolResultSuccess } from "../../src/core/tools/result";
import type { SessionMessage } from "../../src/core/types";
import { FakeModelAdapter } from "../helpers/fakeModelAdapter";
import { FakeToolProvider } from "../helpers/fakeToolProvider";

function createRegistry(): SkillRegistry {
	return {
		listCatalog() {
			return [
				{
					name: "writer",
					description: "Writes docs",
					location: "/tmp/writer/SKILL.md",
				},
			];
		},
		listSkills() {
			return [
				{
					name: "writer",
					description: "Writes docs",
					body: "Write clearly.",
					metadata: {
						name: "writer",
						description: "Writes docs",
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

describe("skills integration parity", () => {
	test("model and slash activation produce equivalent assistant+tool history shape", async () => {
		const activator = new SkillActivator({ registry: createRegistry() });
		const activateTool = createActivateSkillTool({ activator });

		const model = new FakeModelAdapter([
			{
				assistantText: null,
				toolCall: {
					name: "activate_skill",
					args: { name: "writer" },
					callId: "call_same",
				},
			},
			{
				assistantText: "done",
				toolCall: null,
			},
		]);

		const toolRegistry = await buildToolRegistry([
			new FakeToolProvider([activateTool]),
		]);
		const runner = createSessionRunner({
			model,
			registry: toolRegistry,
			policies: [],
			runtime: {
				model: "test",
				maxTurns: 3,
			},
		});

		const modelResult = await runner.run({
			instructions: "base",
			userText: "activate writer",
			context: {},
			history: [],
		});

		const modelAssistantMessage = modelResult.history.find(
			(message) =>
				message.role === "assistant" && message.toolCall !== undefined,
		);
		const modelToolMessage = modelResult.history.find(
			(message) => message.role === "tool",
		);

		const userHistory: SessionMessage[] = [];
		const activation = await activator.activate("writer");
		expect(activation.ok).toBe(true);
		if (!activation.ok) {
			return;
		}

		appendToolHistoryPair({
			history: userHistory,
			toolName: "activate_skill",
			args: { name: "writer" },
			result: toToolResultSuccess(activation.data),
			callId: "call_same",
		});

		const userAssistantMessage = userHistory[0];
		const userToolMessage = userHistory[1];

		expect(modelAssistantMessage?.role).toBe(userAssistantMessage?.role);
		expect(modelAssistantMessage?.toolCall?.name).toBe(
			userAssistantMessage?.toolCall?.name,
		);
		expect(modelAssistantMessage?.toolCall?.id).toBe(
			userAssistantMessage?.toolCall?.id,
		);
		expect(modelToolMessage?.role).toBe(userToolMessage?.role);
		expect(modelToolMessage?.name).toBe(userToolMessage?.name);
	});
});
