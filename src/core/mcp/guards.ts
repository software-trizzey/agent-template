import { toToolResultFailure } from "../tools/result";
import type { NormalizedMcpServerConfig } from "../types/mcp";
import type { ToolExecutionFailure } from "../types/tools";

const encoder = new TextEncoder();

function toPatternRegex(pattern: string): RegExp {
	const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&");
	const wildcard = escaped.replace(/\*/g, ".*");
	return new RegExp(`^${wildcard}$`);
}

function matchesAnyPattern(value: string, patterns: string[]): boolean {
	for (const pattern of patterns) {
		if (toPatternRegex(pattern).test(value)) {
			return true;
		}
	}

	return false;
}

export function isMcpToolAllowed(
	serverConfig: NormalizedMcpServerConfig,
	toolName: string,
): boolean {
	if (matchesAnyPattern(toolName, serverConfig.blockTools)) {
		return false;
	}

	if (serverConfig.allowTools.length === 0) {
		return true;
	}

	return matchesAnyPattern(toolName, serverConfig.allowTools);
}

export function enforceMcpArgSize(
	serverConfig: NormalizedMcpServerConfig,
	args: Record<string, unknown>,
): ToolExecutionFailure | null {
	const bytes = encoder.encode(JSON.stringify(args)).byteLength;
	if (bytes <= serverConfig.maxArgBytes) {
		return null;
	}

	return toToolResultFailure(
		"INVALID_TOOL_ARGUMENTS",
		`Tool arguments exceed maxArgBytes (${serverConfig.maxArgBytes}) for MCP server ${serverConfig.id}`,
	);
}
