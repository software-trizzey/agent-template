import { normalizeObjectToolSchema } from "./helpers";

export function toOpenAIToolParameters(params: {
	inputSchemaJson: Record<string, unknown>;
	isMcpTool: boolean;
}): Record<string, unknown> {
	if (!params.isMcpTool) {
		return params.inputSchemaJson;
	}

	return normalizeObjectToolSchema(params.inputSchemaJson);
}
