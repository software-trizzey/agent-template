import { describe, expect, test } from "bun:test";
import {
	installShutdownHooks,
	type ProcessSignalHooks,
} from "../../src/core/lifecycle/shutdown";

describe("installShutdownHooks", () => {
	test("registers and unregisters signal handlers", () => {
		const registered: Array<{
			event: "SIGINT" | "SIGTERM";
			listener: () => void;
		}> = [];
		const removed: Array<{
			event: "SIGINT" | "SIGTERM";
			listener: () => void;
		}> = [];

		const processHooks: ProcessSignalHooks = {
			once(event, listener) {
				registered.push({ event, listener });
			},
			off(event, listener) {
				removed.push({ event, listener });
			},
			exit() {
				throw new Error("exit should not be called in this test");
			},
		};

		const dispose = installShutdownHooks(async () => undefined, processHooks);

		expect(registered.map((entry) => entry.event)).toEqual([
			"SIGINT",
			"SIGTERM",
		]);

		dispose();

		expect(removed.map((entry) => entry.event)).toEqual(["SIGINT", "SIGTERM"]);
		expect(removed[0]?.listener).toBe(registered[0]?.listener);
		expect(removed[1]?.listener).toBe(registered[1]?.listener);
	});
});
