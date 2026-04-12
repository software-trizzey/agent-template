import { describe, expect, test } from "bun:test";
import { listAvailableModels } from "../../src/core/model";

function sortRows(
	rows: Array<{ modelId: string; modelName: string; providerName: string }>,
): Array<{ modelId: string; modelName: string; providerName: string }> {
	return [...rows].sort((left, right) => {
		const providerComparison = left.providerName.localeCompare(
			right.providerName,
		);
		if (providerComparison !== 0) {
			return providerComparison;
		}

		return left.modelName.localeCompare(right.modelName);
	});
}

describe("listAvailableModels", () => {
	test("returns normalized provider/model rows", () => {
		const rows = listAvailableModels();

		expect(rows.length).toBeGreaterThan(0);
		expect(rows.every((row) => row.modelName.length > 0)).toBe(true);
		expect(rows.every((row) => row.providerName.length > 0)).toBe(true);
	});

	test("returns rows in deterministic provider/model ordering", () => {
		const rows = listAvailableModels();
		expect(rows).toEqual(sortRows(rows));
	});

	test("filters to signed-in providers only", () => {
		const rows = listAvailableModels({
			isProviderSignedIn(provider) {
				return provider === "openai";
			},
		});

		expect(rows.length).toBeGreaterThan(0);
		expect(rows.every((row) => row.providerName === "openai")).toBe(true);
	});

	test("returns no rows when no providers are signed in", () => {
		const rows = listAvailableModels({
			isProviderSignedIn() {
				return false;
			},
		});

		expect(rows).toEqual([]);
	});
});
