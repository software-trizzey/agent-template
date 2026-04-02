import type {
	ModelToolDefinition,
	ModelTurn,
	ModelTurnInput,
	SessionMessage,
	SessionToolCall,
	ToolCall,
} from "../schemas/model";
import type { UnifiedToolDescriptor } from "./tools";

export type {
	ModelToolDefinition,
	ModelTurn,
	ModelTurnInput,
	SessionMessage,
	SessionToolCall,
	ToolCall,
};

export type ModelAdapter = {
	toModelTool: (descriptor: UnifiedToolDescriptor) => ModelToolDefinition;
	nextTurn: (input: ModelTurnInput) => Promise<ModelTurn>;
};
