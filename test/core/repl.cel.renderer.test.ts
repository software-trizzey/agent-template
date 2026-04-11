import { describe, expect, test } from "bun:test";
import type { Node, Terminal } from "@cel-tui/core";
import { createInitialReplUiState } from "../../src/core/cli/repl/types";
import { createCelReplRenderer } from "../../src/core/cli/repl/ui/cel/renderer";
import { findTextInput } from "../helpers/celNode";

describe("createCelReplRenderer", () => {
	test("honors start/render/stop contract and stop idempotency", () => {
		let viewportRender: (() => Node | Node[]) | null = null;
		let initCalls = 0;
		let renderCalls = 0;
		let stopCalls = 0;

		const renderer = createCelReplRenderer({
			runtime: {
				init() {
					initCalls += 1;
				},
				viewport(render: () => Node | Node[]) {
					viewportRender = render;
				},
				render() {
					renderCalls += 1;
				},
				stop() {
					stopCalls += 1;
				},
			},
			createTerminal() {
				return {
					write() {},
					get columns() {
						return 80;
					},
					get rows() {
						return 24;
					},
					start() {},
					stop() {},
					hideCursor() {},
					showCursor() {},
				} satisfies Terminal;
			},
		});

		renderer.start(createInitialReplUiState(), {
			onSubmit() {},
			onExit() {},
		});
		renderer.render(createInitialReplUiState());
		renderer.stop();
		renderer.stop();

		expect(initCalls).toBe(1);
		expect(typeof viewportRender).toBe("function");
		expect(renderCalls).toBe(2);
		expect(stopCalls).toBe(1);
	});

	test("emits submit intent by intercepting enter", () => {
		let viewportRender: (() => Node | Node[]) | null = null;
		const submitted: string[] = [];

		const renderer = createCelReplRenderer({
			runtime: {
				init() {},
				viewport(render: () => Node | Node[]) {
					viewportRender = render;
				},
				render() {},
				stop() {},
			},
			createTerminal() {
				return {
					write() {},
					get columns() {
						return 80;
					},
					get rows() {
						return 24;
					},
					start() {},
					stop() {},
					hideCursor() {},
					showCursor() {},
				} satisfies Terminal;
			},
		});

		renderer.start(createInitialReplUiState(), {
			onSubmit(value) {
				submitted.push(value);
			},
			onExit() {},
		});

		const renderView = viewportRender as unknown as () => Node | Node[];
		const tree = renderView();
		if (tree === null || tree === undefined || Array.isArray(tree)) {
			throw new Error("Expected single view node");
		}

		const input = findTextInput(tree);
		if (input === null) {
			throw new Error("Expected TextInput in view tree");
		}

		input.props.onChange("hello");
		expect(input.props.onKeyPress?.("enter")).toBe(false);
		expect(submitted).toEqual(["hello"]);
	});
});
