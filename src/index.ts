import { runCli } from "./core/cli";
import { parseCliArgs } from "./core/cli/args";
import { formatActivityEvent } from "./core/cli/output";
import { installShutdownHooks } from "./core/lifecycle/shutdown";
import { createModelAdapterFromSpec } from "./core/model";
import { runSession } from "./core/session";
import { buildToolRegistry } from "./core/tools/registry";
import type { RuntimeConfig } from "./core/types";
import { activeProfile } from "./profile";

async function main(): Promise<void> {
	const args = parseCliArgs(process.argv.slice(2));
	const profileEnv =
		activeProfile.env.parse?.(process.env) ?? activeProfile.env.defaults;
	const providers = await activeProfile.createProviders(profileEnv);
	const registry = await buildToolRegistry(providers);

	let isShutDown = false;
	const shutdown = async (): Promise<void> => {
		if (isShutDown) {
			return;
		}

		isShutDown = true;
		await registry.shutdown();
	};

	const uninstallShutdownHooks = installShutdownHooks(shutdown);

	try {
		const runtime: RuntimeConfig = {
			model: args.model,
			maxTurns: args.maxTurns,
			onActivity(event) {
				process.stdout.write(`${formatActivityEvent(event)}\n`);
			},
		};

		const model = createModelAdapterFromSpec({
			modelSpec: runtime.model,
		});

		await runCli({
			args,
			async runPrompt(
				prompt,
				history,
			): Promise<{ output: string; history: typeof history }> {
				const context = activeProfile.deriveContext({
					userText: prompt,
					history: history.map(
						(message) => `${message.role}:${message.content}`,
					),
				});

				const result = await runSession({
					model,
					registry,
					policies: activeProfile.policies,
					runtime,
					session: {
						instructions: activeProfile.instructions,
						userText: prompt,
						context,
						history,
					},
				});

				return {
					output: result.finalAssistantMessage,
					history: result.history,
				};
			},
		});
	} finally {
		uninstallShutdownHooks();
		await shutdown();
	}
}

main().catch((error) => {
	const message = error instanceof Error ? error.message : String(error);
	process.stderr.write(`${message}\n`);
	process.exit(1);
});
