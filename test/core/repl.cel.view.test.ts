import { describe, expect, test } from "bun:test";
import { createInitialReplUiState } from "../../src/core/cli/repl/types";
import { createCelReplView } from "../../src/core/cli/repl/ui/cel/view";
import { findTextInput } from "../helpers/celNode";

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
});
