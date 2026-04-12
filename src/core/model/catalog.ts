import { getEnvApiKey, getModels, getProviders } from "@mariozechner/pi-ai";

export type AvailableModel = {
	modelId: string;
	modelName: string;
	providerName: string;
};

type ListAvailableModelsInput = {
	isProviderSignedIn?: (providerName: string) => boolean;
};

function hasProviderCredentials(providerName: string): boolean {
	return getEnvApiKey(providerName) !== undefined;
}

export function listAvailableModels(
	input?: ListAvailableModelsInput,
): AvailableModel[] {
	const rows: AvailableModel[] = [];
	const isProviderSignedIn =
		input?.isProviderSignedIn ?? hasProviderCredentials;

	for (const provider of getProviders()) {
		if (!isProviderSignedIn(provider)) {
			continue;
		}

		for (const model of getModels(provider)) {
			rows.push({
				modelId: model.id,
				modelName: model.name,
				providerName: provider,
			});
		}
	}

	return rows.sort((left, right) => {
		const providerComparison = left.providerName.localeCompare(
			right.providerName,
		);
		if (providerComparison !== 0) {
			return providerComparison;
		}

		return left.modelName.localeCompare(right.modelName);
	});
}
