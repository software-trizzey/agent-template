import type {
	ModelAdapter,
	ModelToolDefinition,
	ModelTurn,
	ModelTurnInput,
	UnifiedToolDescriptor,
} from "../../src/core/types";

export class FakeModelAdapter implements ModelAdapter {
	private readonly turns: ModelTurn[];
	private cursor: number;

	constructor(turns: ModelTurn[]) {
		this.turns = turns;
		this.cursor = 0;
	}

	toModelTool(descriptor: UnifiedToolDescriptor): ModelToolDefinition {
		return {
			name: descriptor.name,
			description: descriptor.description,
			parameters: descriptor.inputSchemaJson,
			strict: descriptor.provider !== "mcp",
		};
	}

	async nextTurn(_: ModelTurnInput): Promise<ModelTurn> {
		if (this.cursor >= this.turns.length) {
			return {
				assistantText: null,
				toolCall: null,
			};
		}

		const turn = this.turns[this.cursor];
		if (turn === undefined) {
			return {
				assistantText: null,
				toolCall: null,
			};
		}

		this.cursor += 1;
		return turn;
	}
}
