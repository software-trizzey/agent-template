export type ShutdownHandler = () => Promise<void>;

export type ProcessSignalHooks = {
	once: (event: "SIGINT" | "SIGTERM", listener: () => void) => void;
	off: (event: "SIGINT" | "SIGTERM", listener: () => void) => void;
	exit: (code: number) => never;
};

export function installShutdownHooks(
	handler: ShutdownHandler,
	processHooks: ProcessSignalHooks = process,
): () => void {
	const signalHandler = () => {
		void handler().finally(() => {
			processHooks.exit(0);
		});
	};

	processHooks.once("SIGINT", signalHandler);
	processHooks.once("SIGTERM", signalHandler);

	return () => {
		processHooks.off("SIGINT", signalHandler);
		processHooks.off("SIGTERM", signalHandler);
	};
}
