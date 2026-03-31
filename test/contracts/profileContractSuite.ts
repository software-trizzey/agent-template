import { describe, expect, test } from "bun:test";
import type { AgentProfile } from "../../src/core/types";

export function runProfileContractSuite<Context, Env>(
	profileName: string,
	profile: AgentProfile<Context, Env>,
): void {
	describe(`profile contract: ${profileName}`, () => {
		test("provides non-empty instructions", () => {
			expect(profile.instructions.trim().length > 0).toBe(true);
		});

		test("context derivation is deterministic", () => {
			const input = {
				userText: "Find docs",
				history: ["hello"],
			};

			const first = profile.deriveContext(input);
			const second = profile.deriveContext(input);
			expect(first).toEqual(second);
		});

		test("registers at least one tool provider", async () => {
			const providers = await profile.createProviders(profile.env.defaults);
			expect(providers.length > 0).toBe(true);
			await Promise.all(providers.map((provider) => provider.shutdown()));
		});

		test("declares env defaults", () => {
			expect(profile.env.defaults).toBeDefined();
		});

		test("policy list is defined", () => {
			expect(Array.isArray(profile.policies)).toBe(true);
		});
	});
}
