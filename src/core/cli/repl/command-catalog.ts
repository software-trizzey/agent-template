export type ReplBuiltInCommandName =
	| "help"
	| "reset"
	| "skills"
	| "skill"
	| "exit";

export type ReplBuiltInCommand = {
	name: ReplBuiltInCommandName;
	canonical: string;
	aliases: string[];
	description: string;
	argumentShape: "none" | "required_name";
};

export const REPL_COMMAND_CATALOG: readonly ReplBuiltInCommand[] = [
	{
		name: "help",
		canonical: "/help",
		aliases: [],
		description: "Show available commands",
		argumentShape: "none",
	},
	{
		name: "reset",
		canonical: "/reset",
		aliases: [],
		description: "Clear session history",
		argumentShape: "none",
	},
	{
		name: "skills",
		canonical: "/skills",
		aliases: [],
		description: "List available skills",
		argumentShape: "none",
	},
	{
		name: "skill",
		canonical: "/skill",
		aliases: [],
		description: "Activate a skill",
		argumentShape: "required_name",
	},
	{
		name: "exit",
		canonical: "/exit",
		aliases: [":q"],
		description: "Exit the REPL",
		argumentShape: "none",
	},
];

export const BUILT_IN_COMMAND_LITERALS = REPL_COMMAND_CATALOG.flatMap(
	(entry) => [entry.canonical, ...entry.aliases],
);

export function formatReplHelpLines(): string[] {
	return [
		"Commands:",
		...REPL_COMMAND_CATALOG.map((command) => {
			if (command.name === "skill") {
				return "  /skill <name> Activate a skill";
			}

			if (command.name === "exit") {
				return "  /exit, :q Exit the REPL";
			}

			return `  ${command.canonical} ${command.description}`;
		}),
		"  /<skill-name> Activate via alias",
	];
}
