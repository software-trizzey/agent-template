import type {
	ModelAdapter,
	ModelToolDefinition,
	ModelTurn,
	ModelTurnInput,
} from "../types/model";
import type { UnifiedToolDescriptor } from "../types/tools";

export type CoreModelAdapter = ModelAdapter;

export function createModelAdapter(input: {
	toModelTool: (descriptor: UnifiedToolDescriptor) => ModelToolDefinition;
	nextTurn: (modelInput: ModelTurnInput) => Promise<ModelTurn>;
}): CoreModelAdapter {
	return {
		toModelTool: input.toModelTool,
		nextTurn: input.nextTurn,
	};
}
