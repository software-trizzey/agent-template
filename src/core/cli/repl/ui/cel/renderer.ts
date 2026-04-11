import { cel, type Node, ProcessTerminal, type Terminal } from "@cel-tui/core";
import type { ReplUiState } from "../../types";
import type { ReplRendererHandlers, ReplRendererPort } from "../port";
import { createCelReplView } from "./view";

type CelRuntime = {
	init: (terminal: Terminal) => void;
	viewport: (render: () => Node | Node[]) => void;
	render: () => void;
	stop: () => void;
};

export function createCelReplRenderer(input?: {
	runtime?: CelRuntime;
	createTerminal?: () => Terminal;
}): ReplRendererPort {
	const runtime = input?.runtime ?? cel;
	const createTerminal = input?.createTerminal ?? (() => new ProcessTerminal());
	let currentState: ReplUiState | null = null;
	let handlers: ReplRendererHandlers | null = null;
	let inputValue = "";
	let started = false;

	return {
		start(initialState, nextHandlers) {
			if (started) {
				return;
			}

			started = true;
			currentState = initialState;
			handlers = nextHandlers;
			inputValue = "";

			runtime.init(createTerminal());
			runtime.viewport(() => {
				if (currentState === null || handlers === null) {
					return createCelReplView({
						state: initialState,
						inputValue: "",
						onInputChange: () => undefined,
						onSubmit: () => undefined,
						onExit: () => undefined,
					});
				}

				return createCelReplView({
					state: currentState,
					inputValue,
					onInputChange(value) {
						inputValue = value;
						runtime.render();
					},
					onSubmit() {
						const submitValue = inputValue;
						inputValue = "";
						handlers?.onSubmit(submitValue);
						runtime.render();
					},
					onExit() {
						handlers?.onExit();
					},
				});
			});
			runtime.render();
		},
		render(nextState) {
			if (!started) {
				return;
			}

			currentState = nextState;
			runtime.render();
		},
		stop() {
			if (!started) {
				return;
			}

			started = false;
			runtime.stop();
		},
	};
}
