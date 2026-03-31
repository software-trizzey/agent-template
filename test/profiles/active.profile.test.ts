import { describe, expect, test } from "bun:test";
import { activeProfile } from "../../src/profile";
import { defaultProfile } from "../../src/profiles/default";

describe("active profile wiring", () => {
	test("uses the default profile by default", () => {
		expect(activeProfile.id).toBe(defaultProfile.id);
	});
});
