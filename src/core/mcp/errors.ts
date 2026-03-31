export function toMcpErrorMessage(prefix: string, error: unknown): string {
	const message = error instanceof Error ? error.message : String(error);
	return `${prefix}: ${message}`;
}

export async function withTimeout<T>(input: {
	promise: Promise<T>;
	timeoutMs: number;
	timeoutMessage: string;
}): Promise<T> {
	let timer: ReturnType<typeof setTimeout> | null = null;

	const timeoutPromise = new Promise<never>((_, reject) => {
		timer = setTimeout(() => {
			reject(new Error(input.timeoutMessage));
		}, input.timeoutMs);
	});

	try {
		return await Promise.race([input.promise, timeoutPromise]);
	} finally {
		if (timer !== null) {
			clearTimeout(timer);
		}
	}
}
