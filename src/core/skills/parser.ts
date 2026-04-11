import { parseDocument } from "yaml";
import type {
	ParsedSkillDocument,
	ParseSkillDocumentResult,
	SkillFrontmatter,
	SkillWarning,
} from "./types";

const SKILL_NAME_PATTERN = /^[a-z0-9_-]+$/;

function toWarning(
	code: SkillWarning["code"],
	message: string,
	sourcePath?: string,
): SkillWarning {
	return {
		code,
		message,
		sourcePath,
	};
}

function extractFrontmatterBlock(source: string): {
	frontmatterSource: string;
	body: string;
} {
	if (!source.startsWith("---\n")) {
		throw new Error("SKILL.md must start with a YAML frontmatter block");
	}

	let endIndex = source.indexOf("\n---\n", 4);
	let delimiterLength = 5;
	if (endIndex < 0) {
		endIndex = source.indexOf("\n---", 4);
		delimiterLength = 4;
	}

	if (endIndex < 0) {
		throw new Error("YAML frontmatter block must end with a closing delimiter");
	}

	const frontmatterSource = source.slice(4, endIndex).trimEnd();
	const body = source.slice(endIndex + delimiterLength).replace(/^\n/, "");

	return {
		frontmatterSource,
		body,
	};
}

function parseYamlFrontmatter(
	frontmatterSource: string,
): Record<string, unknown> {
	const document = parseDocument(frontmatterSource, {
		strict: true,
		uniqueKeys: true,
	});

	if (document.errors.length > 0) {
		const firstError = document.errors[0];
		if (firstError !== undefined) {
			throw firstError;
		}

		throw new Error("Invalid YAML frontmatter");
	}

	const parsed = document.toJS();
	if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
		throw new Error("YAML frontmatter must be an object mapping");
	}

	return parsed as Record<string, unknown>;
}

function validateSkillMetadata(input: {
	frontmatter: Record<string, unknown>;
	body: string;
	sourcePath?: string;
}): ParseSkillDocumentResult {
	const warnings: SkillWarning[] = [];
	const metadata = input.frontmatter as SkillFrontmatter;
	const typedName =
		typeof metadata.name === "string" ? metadata.name.trim() : "";
	const typedDescription =
		typeof metadata.description === "string" ? metadata.description.trim() : "";

	if (typedName.length === 0 || typedDescription.length === 0) {
		warnings.push(
			toWarning(
				"SKILL_MISSING_REQUIRED_FIELD",
				"Skill metadata must include non-empty `name` and `description`.",
				input.sourcePath,
			),
		);
		return { skill: null, warnings };
	}

	if (typedName.length > 64 || !SKILL_NAME_PATTERN.test(typedName)) {
		warnings.push(
			toWarning(
				"SKILL_INVALID_METADATA",
				"Skill `name` must match ^[a-z0-9_-]+$ and be 1-64 chars.",
				input.sourcePath,
			),
		);
		return { skill: null, warnings };
	}

	if (typedDescription.length > 280) {
		warnings.push(
			toWarning(
				"SKILL_INVALID_METADATA",
				"Skill `description` must be 1-280 chars after trim.",
				input.sourcePath,
			),
		);
		return { skill: null, warnings };
	}

	const skill: ParsedSkillDocument = {
		name: typedName,
		description: typedDescription,
		body: input.body,
		metadata: {
			...metadata,
			name: typedName,
			description: typedDescription,
		},
	};

	return {
		skill,
		warnings,
	};
}

export function parseSkillDocument(input: {
	content: string;
	sourcePath?: string;
}): ParseSkillDocumentResult {
	try {
		const extracted = extractFrontmatterBlock(input.content);
		const frontmatter = parseYamlFrontmatter(extracted.frontmatterSource);
		return validateSkillMetadata({
			frontmatter,
			body: extracted.body,
			sourcePath: input.sourcePath,
		});
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		return {
			skill: null,
			warnings: [toWarning("SKILL_PARSE_ERROR", message, input.sourcePath)],
		};
	}
}
