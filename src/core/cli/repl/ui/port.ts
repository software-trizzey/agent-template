import type { ReplUiState } from "../types";

export type ReplRendererHandlers = {
	onSubmit: (value: string) => void;
	onExit: () => void;
};

export type ReplRendererPort = {
	start: (state: ReplUiState, handlers: ReplRendererHandlers) => void;
	render: (state: ReplUiState) => void;
	stop: () => void;
};
