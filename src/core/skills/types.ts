export type SkillScope = "project" | "user";

export type SkillWarningCode =
	| "SKILL_PARSE_ERROR"
	| "SKILL_MISSING_REQUIRED_FIELD"
	| "SKILL_INVALID_METADATA"
	| "SKILL_DUPLICATE_NAME"
	| "SKILL_RESERVED_NAME"
	| "SKILL_TRUST_ROOT_VIOLATION";

export type SkillWarning = {
	code: SkillWarningCode;
	message: string;
	sourcePath?: string;
};

export type SkillFrontmatter = {
	name: string;
	description: string;
	[key: string]: unknown;
};

export type ParsedSkillDocument = {
	name: string;
	description: string;
	body: string;
	metadata: SkillFrontmatter;
};

export type DiscoveredSkill = ParsedSkillDocument & {
	scope: SkillScope;
	skillFilePath: string;
	skillDirectoryPath: string;
};

export type SkillCatalogEntry = {
	name: string;
	description: string;
	location: string;
};

export type SkillRegistry = {
	listCatalog: () => SkillCatalogEntry[];
	listSkills: () => DiscoveredSkill[];
	lookupByName: (name: string) => DiscoveredSkill | null;
	warnings: SkillWarning[];
};

export type ParseSkillDocumentResult = {
	skill: ParsedSkillDocument | null;
	warnings: SkillWarning[];
};

export type SkillRegistryOptions = {
	projectRoots: string[];
	userRoots: string[];
	allowProjectSkills: boolean;
	allowedRoots: string[];
	reservedNames: string[];
};

export type ActivateSkillSuccess = {
	ok: true;
	data: {
		skillName: string;
		content: string;
		location: string;
		truncated: boolean;
	};
};

export type ActivateSkillFailure = {
	ok: false;
	code: "SKILL_NOT_FOUND";
	message: string;
};

export type ActivateSkillResult = ActivateSkillSuccess | ActivateSkillFailure;
