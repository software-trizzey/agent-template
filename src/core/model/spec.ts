export type SupportedModelProvider = "openai" | "anthropic";

export type ParsedModelSpec = {
	provider: SupportedModelProvider;
	modelId: string;
};

function isSupportedProvider(value: string): value is SupportedModelProvider {
	return value === "openai" || value === "anthropic";
}

export function parseModelSpec(spec: string): ParsedModelSpec {
	const trimmed = spec.trim();
	if (trimmed.length === 0) {
		throw new Error(
			"Model spec is required. Expected format: <provider>/<model>.",
		);
	}

	const separatorIndex = trimmed.indexOf("/");
	if (separatorIndex <= 0 || separatorIndex === trimmed.length - 1) {
		throw new Error(
			`Invalid model spec "${spec}". Expected format: <provider>/<model>.`,
		);
	}

	const provider = trimmed.slice(0, separatorIndex);
	const modelId = trimmed.slice(separatorIndex + 1).trim();
	if (!isSupportedProvider(provider)) {
		throw new Error(
			`Unsupported model provider "${provider}". Supported providers: openai, anthropic.`,
		);
	}

	if (modelId.length === 0) {
		throw new Error(`Invalid model spec "${spec}". Model id cannot be empty.`);
	}

	return {
		provider,
		modelId,
	};
}
