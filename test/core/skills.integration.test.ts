import { describe, expect, test } from "bun:test";
import { createCliPromptHandler } from "../../src/core/cli";
import { createSessionRunner } from "../../src/core/session";
import { SkillActivator } from "../../src/core/skills/activator";
import { createActivateSkillTool } from "../../src/core/skills/tool";
import type { SkillRegistry } from "../../src/core/skills/types";
import { buildToolRegistry } from "../../src/core/tools/registry";
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

function toActivationHistoryShape(history: SessionMessage[]): {
	assistantRole: string;
	toolRole: string;
	toolName: string;
	args: unknown;
	callIdMatchesToolMessage: boolean;
	serializedToolResult: unknown;
} {
	const assistant = history.find(
		(message) => message.role === "assistant" && message.toolCall !== undefined,
	);
	const tool = history.find((message) => message.role === "tool");

	if (assistant?.toolCall === undefined || tool?.name === undefined) {
		throw new Error("Missing assistant/tool activation pair in history");
	}

	return {
		assistantRole: assistant.role,
		toolRole: tool.role,
		toolName: assistant.toolCall.name,
		args: assistant.toolCall.args,
		callIdMatchesToolMessage: assistant.toolCall.id === tool.name,
		serializedToolResult: JSON.parse(tool.content),
	};
}

describe("skills integration parity", () => {
	test("model, /skill, and alias activation produce equivalent assistant+tool history shape", async () => {
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

		const slashSkillHistory: SessionMessage[] = [];
		const slashAliasHistory: SessionMessage[] = [];
		let runPromptCallCount = 0;
		const runPrompt = async (
			_prompt: string,
			_history: SessionMessage[],
		): Promise<{
			output: string;
			history: SessionMessage[];
		}> => {
			runPromptCallCount += 1;
			return {
				output: "unused",
				history: [],
			};
		};

		const skillsAdapter = {
			listSkillNames() {
				return ["writer"];
			},
			listSkillSummaries() {
				return [{ name: "writer", description: "Writes docs" }];
			},
			activateByName(name: string) {
				return activator.activate(name);
			},
		};

		const slashSkillHandler = createCliPromptHandler({
			isReplMode: true,
			history: slashSkillHistory,
			runPrompt,
			skills: skillsAdapter,
		});
		const slashAliasHandler = createCliPromptHandler({
			isReplMode: true,
			history: slashAliasHistory,
			runPrompt,
			skills: skillsAdapter,
		});

		await slashSkillHandler("/skill writer");
		await slashAliasHandler("/writer");

		expect(runPromptCallCount).toBe(0);

		const modelShape = toActivationHistoryShape(modelResult.history);
		const slashSkillShape = toActivationHistoryShape(slashSkillHistory);
		const slashAliasShape = toActivationHistoryShape(slashAliasHistory);

		expect(modelShape.assistantRole).toBe("assistant");
		expect(modelShape.toolRole).toBe("tool");
		expect(modelShape.callIdMatchesToolMessage).toBe(true);
		expect(slashSkillShape.callIdMatchesToolMessage).toBe(true);
		expect(slashAliasShape.callIdMatchesToolMessage).toBe(true);

		expect(slashSkillShape).toEqual(modelShape);
		expect(slashAliasShape).toEqual(modelShape);
	});
});
