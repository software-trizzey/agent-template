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
		});

		expect(parsed?.allowExternalTools).toBe(false);
	});
});
