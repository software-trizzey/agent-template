import { describe, expect, test } from "bun:test";
import { defaultProfile } from "../../src/profiles/default";
import { runProfileContractSuite } from "../contracts/profileContractSuite";

runProfileContractSuite("default", defaultProfile);

describe("default profile behavior", () => {
	test("uses domain-agnostic instruction wording", () => {
		expect(defaultProfile.instructions.includes("domain-agnostic")).toBe(true);
	});

	test("parses profile env booleans", () => {
		const parsed = defaultProfile.env.parse?.({
			DEFAULT_PROFILE_ALLOW_EXTERNAL_TOOLS: "false",
			DEFAULT_PROFILE_ALLOW_PROJECT_SKILLS: "false",
		});

		expect(parsed?.allowExternalTools).toBe(false);
		expect(parsed?.allowProjectSkills).toBe(false);
	});

	test("composes local skills provider first", async () => {
		const providers = await defaultProfile.createProviders({
			allowExternalTools: false,
			allowProjectSkills: false,
		});

		expect(providers.length).toBe(1);
		const tools = await providers[0]?.listTools();
		expect(tools?.[0]?.descriptor.name).toBe("activate_skill");
		await Promise.all(providers.map((provider) => provider.shutdown()));
	});
});
