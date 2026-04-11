export type ReplResolvedCommand =
	| { type: "help" }
	| { type: "reset" }
	| { type: "exit" }
	| { type: "prompt"; value: string }
	| { type: "skills_list" }
	| { type: "skill_activate"; name: string }
	| { type: "unknown_slash"; value: string; suggestions: string[] };

const BUILT_IN_COMMANDS = [
	"/help",
	"/reset",
	"/exit",
	":q",
	"/skills",
	"/skill",
];

function toSuggestions(input: string, availableSkillNames: string[]): string[] {
	const normalized = input.toLowerCase();
	const fuzzyPrefix = normalized.slice(0, 3);
	const candidates = [
		...BUILT_IN_COMMANDS,
		...availableSkillNames.map((name) => `/${name}`),
	];

	return candidates
		.filter((candidate) => {
			const candidateNormalized = candidate.toLowerCase();
			return (
				candidateNormalized.includes(normalized) ||
				(fuzzyPrefix.length >= 2 &&
					candidateNormalized.startsWith(`/${fuzzyPrefix}`))
			);
		})
		.slice(0, 5);
}

export function resolveReplCommand(input: {
	raw: string;
	availableSkillNames: string[];
}): ReplResolvedCommand {
	const value = input.raw.trim();
	if (value === "/help") {
		return { type: "help" };
	}

	if (value === "/reset") {
		return { type: "reset" };
	}

	if (value === "/exit" || value === ":q") {
		return { type: "exit" };
	}

	if (value === "/skills") {
		return { type: "skills_list" };
	}

	if (value.startsWith("/skill ")) {
		const name = value.slice("/skill ".length).trim();
		if (name.length === 0) {
			return {
				type: "unknown_slash",
				value,
				suggestions: ["/skills", "/skill <name>"],
			};
		}

		return {
			type: "skill_activate",
			name,
		};
	}

	if (value.startsWith("/")) {
		const aliasName = value.slice(1);
		if (aliasName.length === 0) {
			return {
				type: "unknown_slash",
				value,
				suggestions: ["/help"],
			};
		}

		if (input.availableSkillNames.includes(aliasName)) {
			return {
				type: "skill_activate",
				name: aliasName,
			};
		}

		return {
			type: "unknown_slash",
			value,
			suggestions: toSuggestions(aliasName, input.availableSkillNames),
		};
	}

	return {
		type: "prompt",
		value,
	};
}
