import { describe, expect, test } from "bun:test";
import type { Node } from "@cel-tui/core";
import { createInitialReplUiState } from "../../src/core/cli/repl/types";
import { createCelReplView } from "../../src/core/cli/repl/ui/cel/view";
import { findTextInput } from "../helpers/celNode";

type TextNodeLike = {
	type: "text";
	content: string;
	props: {
		bold?: boolean;
		fgColor?: string;
	};
};

function collectTextNodes(node: Node): TextNodeLike[] {
	if (node.type === "text") {
		return [node as TextNodeLike];
	}

	if (node.type === "textinput") {
		return [];
	}

	return node.children.flatMap((child) => collectTextNodes(child));
}

describe("createCelReplView", () => {
	test("uses key handler semantics for bubbling and consuming", () => {
		let exits = 0;
		const view = createCelReplView({
			state: createInitialReplUiState(),
			inputValue: "",
			onInputChange() {},
			onSubmit() {},
			onExit() {
				exits += 1;
			},
		});

		expect(view.type).toBe("vstack");
		if (view.type === "text") {
			throw new Error("Expected container root node");
		}

		expect(view.props.onKeyPress?.("f1")).toBe(false);
		expect(view.props.onKeyPress?.("ctrl+q")).toBeUndefined();
		expect(exits).toBe(1);

		const input = findTextInput(view);
		if (input === null) {
			throw new Error("TextInput was not found");
		}

		expect(input.props.onKeyPress?.("a")).toBeUndefined();
		expect(input.props.onKeyPress?.("enter")).toBe(false);
	});

	test("renders model rows with emphasized model name and de-emphasized provider", () => {
		const state = createInitialReplUiState();
		state.transcript = [
			{
				kind: "model",
				modelName: "GPT-5",
				providerName: "openai",
				isCurrent: true,
			},
		] as typeof state.transcript;

		const view = createCelReplView({
			state,
			inputValue: "",
			onInputChange() {},
			onSubmit() {},
			onExit() {},
		});

		const textNodes = collectTextNodes(view);
		const modelNode = textNodes.find((node) => node.content === "GPT-5");
		const providerNode = textNodes.find((node) => node.content === "openai");
		const badgeNode = textNodes.find((node) => node.content === "[current]");

		expect(modelNode?.props.bold).toBe(true);
		expect(modelNode?.props.fgColor).toBe("color14");
		expect(providerNode?.props.fgColor).toBe("color08");
		expect(badgeNode?.props.fgColor).toBe("color10");
	});
});
