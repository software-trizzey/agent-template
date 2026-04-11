import { resolve } from "node:path";
import type {
	ActivateSkillResult,
	DiscoveredSkill,
	SkillRegistry,
} from "./types";

const DEFAULT_MAX_BODY_BYTES = 12000;
const DEFAULT_MAX_RESOURCES = 40;

function byteLength(value: string): number {
	return new TextEncoder().encode(value).byteLength;
}

function truncateByBytes(
	value: string,
	maxBytes: number,
): {
	value: string;
	truncated: boolean;
} {
	if (byteLength(value) <= maxBytes) {
		return { value, truncated: false };
	}

	let low = 0;
	let high = value.length;
	while (low < high) {
		const mid = Math.ceil((low + high) / 2);
		const candidate = value.slice(0, mid);
		if (byteLength(candidate) <= maxBytes) {
			low = mid;
			continue;
		}

		high = mid - 1;
	}

	return {
		value: value.slice(0, low),
		truncated: true,
	};
}

function sanitizeTagName(name: string): string {
	return name.replaceAll("&", "&amp;").replaceAll('"', "&quot;");
}

function escapeSkillBody(body: string): string {
	return body.replaceAll("</skill_content>", "<\\/skill_content>");
}

async function listResourceEntries(input: {
	skill: DiscoveredSkill;
	maxEntries: number;
}): Promise<{ entries: string[]; truncated: boolean }> {
	const roots = ["references", "scripts", "assets"];
	const entries: string[] = [];

	for (const root of roots) {
		const absoluteRoot = resolve(input.skill.skillDirectoryPath, root);
		const pattern = new Bun.Glob("**/*");
		try {
			for await (const relativePath of pattern.scan({ cwd: absoluteRoot })) {
				entries.push(`${root}/${relativePath}`);
				if (entries.length >= input.maxEntries) {
					return {
						entries,
						truncated: true,
					};
				}
			}
		} catch {}
	}

	return {
		entries,
		truncated: false,
	};
}

function formatSkillPayload(input: {
	skill: DiscoveredSkill;
	body: string;
	bodyTruncated: boolean;
	resources: string[];
	resourcesTruncated: boolean;
}): string {
	const parts: string[] = [];
	parts.push(`<skill_content name="${sanitizeTagName(input.skill.name)}">`);
	parts.push(`# Skill: ${input.skill.name}`);
	parts.push(`Location: ${input.skill.skillFilePath}`);
	parts.push("");
	parts.push("## Instructions");
	parts.push(escapeSkillBody(input.body));
	if (input.bodyTruncated) {
		parts.push("[TRUNCATED: skill body exceeded configured max bytes]");
	}

	if (input.resources.length > 0) {
		parts.push("");
		parts.push("## Resources");
		for (const resource of input.resources) {
			parts.push(`- ${resource}`);
		}

		if (input.resourcesTruncated) {
			parts.push(
				"[TRUNCATED: resource listing exceeded configured max entries]",
			);
		}
	}

	parts.push("</skill_content>");
	return parts.join("\n");
}

export class SkillActivator {
	private readonly registry: SkillRegistry;
	private readonly maxBodyBytes: number;
	private readonly maxResourceEntries: number;

	constructor(input: {
		registry: SkillRegistry;
		maxBodyBytes?: number;
		maxResourceEntries?: number;
	}) {
		this.registry = input.registry;
		this.maxBodyBytes = input.maxBodyBytes ?? DEFAULT_MAX_BODY_BYTES;
		this.maxResourceEntries = input.maxResourceEntries ?? DEFAULT_MAX_RESOURCES;
	}

	async activate(name: string): Promise<ActivateSkillResult> {
		const skill = this.registry.lookupByName(name);
		if (skill === null) {
			return {
				ok: false,
				code: "SKILL_NOT_FOUND",
				message: `Unknown skill: ${name}`,
			};
		}

		const truncatedBody = truncateByBytes(skill.body, this.maxBodyBytes);
		const resources = await listResourceEntries({
			skill,
			maxEntries: this.maxResourceEntries,
		});
		const content = formatSkillPayload({
			skill,
			body: truncatedBody.value,
			bodyTruncated: truncatedBody.truncated,
			resources: resources.entries,
			resourcesTruncated: resources.truncated,
		});

		return {
			ok: true,
			data: {
				skillName: skill.name,
				content,
				location: skill.skillFilePath,
				truncated: truncatedBody.truncated || resources.truncated,
			},
		};
	}
}
