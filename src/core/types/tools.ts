import type {
	ToolExecutionFailure,
	ToolExecutionResult,
	ToolExecutionSuccess,
	ToolFailureCode,
	UnifiedToolDescriptor,
} from "../schemas/tools";

export type {
	ToolExecutionFailure,
	ToolExecutionResult,
	ToolExecutionSuccess,
	ToolFailureCode,
	UnifiedToolDescriptor,
};

export type UnifiedTool = {
	descriptor: UnifiedToolDescriptor;
	execute: (args: unknown, context: unknown) => Promise<ToolExecutionResult>;
};

export type ToolProvider = {
	listTools: () => Promise<UnifiedTool[]>;
	shutdown: () => Promise<void>;
};

export type ToolRegistry = {
	listTools: () => UnifiedTool[];
	resolve: (toolName: string) => UnifiedTool | null;
	shutdown: () => Promise<void>;
};
