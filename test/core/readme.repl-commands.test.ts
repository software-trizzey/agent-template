import { describe, expect, test } from "bun:test";

describe("README REPL commands", () => {
	test("documents /models command", async () => {
		const readme = await Bun.file("README.md").text();
		expect(readme).toContain(
			"- `/models` (lists available models from signed-in providers, marks current model)",
		);
	});
});
