import { describe, expect, test } from "bun:test";
import { createReplController } from "../../src/core/cli/repl/controller";
import type { ReplUiState } from "../../src/core/cli/repl/types";
import type {
	ReplRendererHandlers,
	ReplRendererPort,
} from "../../src/core/cli/repl/ui/port";
import type { SessionMessage } from "../../src/core/types/model";

function createFakeRenderer(): {
	renderer: ReplRendererPort;
	states: ReplUiState[];
	handlers: ReplRendererHandlers | null;
	stopCalls: number;
} {
	const states: ReplUiState[] = [];
	let handlers: ReplRendererHandlers | null = null;
	let stopCalls = 0;

	return {
		renderer: {
			start(state, registeredHandlers) {
				states.push(state);
				handlers = registeredHandlers;
			},
			render(state) {
				states.push(state);
			},
			stop() {
				stopCalls += 1;
			},
		},
		states,
		get handlers() {
			return handlers;
		},
		get stopCalls() {
			return stopCalls;
		},
	};
}

async function flushAsync(): Promise<void> {
	await new Promise((resolve) => setTimeout(resolve, 0));
}

describe("createReplController", () => {
	test("submits prompt through runPrompt and updates history", async () => {
		const history: SessionMessage[] = [];
		let runPromptCalls = 0;
		const fakeRenderer = createFakeRenderer();
		const controller = createReplController({
			renderer: fakeRenderer.renderer,
			history,
			runPrompt: async (prompt) => {
				runPromptCalls += 1;
				return {
					output: `assistant:${prompt}`,
					history: [
						{ role: "user", content: prompt },
						{ role: "assistant", content: `assistant:${prompt}` },
					],
				};
			},
		});

		controller.start();
		fakeRenderer.handlers?.onSubmit("hello");
		await flushAsync();

		expect(runPromptCalls).toBe(1);
		expect(history.length).toBe(2);
		expect(fakeRenderer.states.at(-1)?.transcript.at(-1)).toEqual({
			kind: "assistant",
			text: "assistant:hello",
		});
	});

	test("handles reset and exits without running prompt", async () => {
		const history: SessionMessage[] = [{ role: "user", content: "before" }];
		let runPromptCalls = 0;
		const fakeRenderer = createFakeRenderer();
		const controller = createReplController({
			renderer: fakeRenderer.renderer,
			history,
			runPrompt: async () => {
				runPromptCalls += 1;
				return {
					output: "unused",
					history: [],
				};
			},
		});

		controller.start();
		fakeRenderer.handlers?.onSubmit("/reset");
		await flushAsync();
		expect(history).toEqual([]);

		fakeRenderer.handlers?.onSubmit("/exit");
		await flushAsync();

		expect(runPromptCalls).toBe(0);
		expect(fakeRenderer.stopCalls).toBe(1);
		expect(controller.isRunning()).toBe(false);
	});

	test("routes /skills and /skill without prompt execution", async () => {
		const history: SessionMessage[] = [];
		let runPromptCalls = 0;
		const fakeRenderer = createFakeRenderer();
		const controller = createReplController({
			renderer: fakeRenderer.renderer,
			history,
			runPrompt: async () => {
				runPromptCalls += 1;
				return {
					output: "unused",
					history: [],
				};
			},
			skills: {
				listSkillNames() {
					return ["writer"];
				},
				listSkillSummaries() {
					return [{ name: "writer", description: "Writes docs" }];
				},
				async activateByName() {
					return {
						ok: true as const,
						data: { content: "ok" },
					};
				},
			},
		});

		controller.start();
		fakeRenderer.handlers?.onSubmit("/skills");
		fakeRenderer.handlers?.onSubmit("/writer");
		await flushAsync();

		expect(runPromptCalls).toBe(0);
		expect(history.length).toBe(2);
		const lastSystemRows = (
			fakeRenderer.states.at(-1)?.transcript ?? []
		).filter((row) => row.kind === "system");
		expect(lastSystemRows.at(-1)?.text).toBe("Activated skill: writer");
	});

	test("renders help rows and unknown slash errors via command handling", async () => {
		const fakeRenderer = createFakeRenderer();
		const controller = createReplController({
			renderer: fakeRenderer.renderer,
			history: [],
			runPrompt: async () => ({ output: "unused", history: [] }),
			skills: {
				listSkillNames() {
					return ["writer"];
				},
				listSkillSummaries() {
					return [{ name: "writer", description: "Writes docs" }];
				},
				async activateByName() {
					return {
						ok: true as const,
						data: { content: "ok" },
					};
				},
			},
		});

		controller.start();
		fakeRenderer.handlers?.onSubmit("/help");
		fakeRenderer.handlers?.onSubmit("/writr");
		await flushAsync();

		const rows = fakeRenderer.states.at(-1)?.transcript ?? [];
		expect(
			rows.some((row) => row.kind === "system" && row.text === "Commands:"),
		).toBe(true);
		expect(rows.some((row) => row.kind === "error")).toBe(true);
	});

	test("routes activity events inline", () => {
		const fakeRenderer = createFakeRenderer();
		const controller = createReplController({
			renderer: fakeRenderer.renderer,
			history: [],
			runPrompt: async () => ({ output: "", history: [] }),
		});
		controller.start();
		controller.onActivity({
			type: "tool_started",
			turn: 2,
			toolName: "search_web",
			callId: "call_1",
		});

		expect(fakeRenderer.states.at(-1)?.transcript.at(-1)?.kind).toBe(
			"activity",
		);
		expect(fakeRenderer.states.at(-1)?.transcript.at(-1)?.text).toContain(
			"tool started",
		);
	});

	test("supports external shutdown hook paths used by signals/errors", () => {
		const fakeRenderer = createFakeRenderer();
		const controller = createReplController({
			renderer: fakeRenderer.renderer,
			history: [],
			runPrompt: async () => ({ output: "", history: [] }),
		});

		controller.start();

		const shutdownController = controller as unknown as {
			shutdown: () => void;
		};

		expect(typeof shutdownController.shutdown).toBe("function");
	});

	test("external shutdown path is idempotent and still resolves waitForStop", async () => {
		const fakeRenderer = createFakeRenderer();
		const controller = createReplController({
			renderer: fakeRenderer.renderer,
			history: [],
			runPrompt: async () => ({ output: "", history: [] }),
		});

		controller.start();

		const shutdownController = controller as unknown as {
			shutdown: () => void;
		};

		shutdownController.shutdown();
		shutdownController.shutdown();
		await controller.waitForStop();

		expect(fakeRenderer.stopCalls).toBe(1);
		expect(controller.isRunning()).toBe(false);
	});
});
