import type { KnownProvider } from "@mariozechner/pi-ai";
import { getModels, getProviders } from "@mariozechner/pi-ai";
import type { ModelAdapter } from "../types/model";
import { createDefaultPiAiModelAdapter } from "./pi-ai";
import { parseModelSpec } from "./spec";

function toKnownProvider(provider: string): KnownProvider {
	const providers = getProviders();
	const knownProvider = providers.find((value) => value === provider);

	if (knownProvider === undefined) {
		throw new Error(
			`Unsupported model provider "${provider}". Available providers: ${providers.join(", ")}.`,
		);
	}

	return knownProvider;
}

export function createModelAdapterFromSpec(input: {
	modelSpec: string;
}): ModelAdapter {
	const parsed = parseModelSpec(input.modelSpec);
	const provider = toKnownProvider(parsed.provider);
	const availableModels = getModels(provider);
	const model = availableModels.find((entry) => entry.id === parsed.modelId);

	if (model === undefined) {
		throw new Error(
			`Unsupported model "${parsed.provider}/${parsed.modelId}". No matching model id found for provider "${parsed.provider}".`,
		);
	}

	return createDefaultPiAiModelAdapter({ model });
}
