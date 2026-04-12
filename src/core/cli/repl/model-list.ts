import { parseModelSpec } from "../../model/spec";

export type ReplModelSummary = {
	modelId: string;
	modelName: string;
	providerName: string;
};

export type ReplListedModel = ReplModelSummary & {
	isCurrent: boolean;
};

function normalizeModelToken(value: string): string {
	return value.trim().toLowerCase();
}

function isMatchingCurrentModel(input: {
	model: ReplModelSummary;
	currentModelSpec: string;
}): boolean {
	try {
		const parsed = parseModelSpec(input.currentModelSpec);
		return (
			normalizeModelToken(input.model.providerName) ===
				normalizeModelToken(parsed.provider) &&
			normalizeModelToken(input.model.modelId) ===
				normalizeModelToken(parsed.modelId)
		);
	} catch {
		return false;
	}
}

export function toListedModels(input: {
	models: ReplModelSummary[];
	currentModelSpec?: string;
}): ReplListedModel[] {
	return input.models.map((model) => ({
		...model,
		isCurrent:
			input.currentModelSpec === undefined
				? false
				: isMatchingCurrentModel({
						model,
						currentModelSpec: input.currentModelSpec,
					}),
	}));
}

function toModelListLine(model: ReplListedModel): string {
	const currentSuffix = model.isCurrent ? " [current]" : "";
	return `${model.modelName} ${model.providerName}${currentSuffix}`;
}

export function formatModelListLines(models: ReplListedModel[]): string[] {
	if (models.length === 0) {
		return ["No models found."];
	}

	return models.map((model) => toModelListLine(model));
}
