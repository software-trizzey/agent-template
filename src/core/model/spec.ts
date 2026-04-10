export type ParsedModelSpec = {
	provider: string;
	modelId: string;
};

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

	const provider = trimmed.slice(0, separatorIndex).trim();
	const modelId = trimmed.slice(separatorIndex + 1).trim();
	if (provider.length === 0) {
		throw new Error(`Invalid model spec "${spec}". Provider cannot be empty.`);
	}

	if (modelId.length === 0) {
		throw new Error(`Invalid model spec "${spec}". Model id cannot be empty.`);
	}

	return {
		provider,
		modelId,
	};
}
