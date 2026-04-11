import { ActivityEventSchema } from "../schemas/activity";
import {
	RuntimeConfigDataSchema,
	SessionInputSchema,
	SessionResultSchema,
} from "../schemas/runtime";
import { executeToolCall } from "../tools/broker";
import type { ModelAdapter, SessionMessage } from "../types/model";
import type { ToolPolicy } from "../types/policy";
import type {
	RuntimeConfig,
	SessionInput,
	SessionResult,
} from "../types/runtime";
import type { ToolRegistry } from "../types/tools";
import { generateToolCallId, serializeToolResult } from "./toolHistory";

function appendMessage(
	history: SessionMessage[],
	message: SessionMessage,
): void {
	history.push(message);
}

function emitActivity(
	runtime: RuntimeConfig,
	event: Parameters<NonNullable<RuntimeConfig["onActivity"]>>[0],
): void {
	const callback = runtime.onActivity;
	if (callback === undefined) {
		return;
	}

	const parsedEvent = ActivityEventSchema.safeParse(event);
	if (!parsedEvent.success) {
		return;
	}

	callback(parsedEvent.data);
}

export function createSessionRunner(dependencies: {
	model: ModelAdapter;
	registry: ToolRegistry;
	policies: ToolPolicy[];
	runtime: RuntimeConfig;
}) {
	return {
		async run(input: SessionInput): Promise<SessionResult> {
			RuntimeConfigDataSchema.parse(dependencies.runtime);
			const parsedInput = SessionInputSchema.parse(input);
			const history: SessionMessage[] = [...parsedInput.history];
			appendMessage(history, {
				role: "user",
				content: parsedInput.userText,
			});

			let turn = 0;
			while (turn < dependencies.runtime.maxTurns) {
				turn += 1;
				emitActivity(dependencies.runtime, { type: "turn_started", turn });

				const tools = dependencies.registry
					.listTools()
					.map((tool) => dependencies.model.toModelTool(tool.descriptor));

				const modelTurn = await dependencies.model.nextTurn({
					instructions: parsedInput.instructions,
					history,
					tools,
				});

				if (modelTurn.assistantText !== null) {
					appendMessage(history, {
						role: "assistant",
						content: modelTurn.assistantText,
					});

					emitActivity(dependencies.runtime, { type: "turn_finished", turn });
					return {
						finalAssistantMessage: modelTurn.assistantText,
						history,
						turnsUsed: turn,
						terminationReason: "assistant_output",
					};
				}

				const toolCall = modelTurn.toolCall;
				if (toolCall !== null) {
					const callId =
						typeof toolCall.callId === "string" && toolCall.callId.length > 0
							? toolCall.callId
							: generateToolCallId();

					appendMessage(history, {
						role: "assistant",
						content: "",
						toolCall: {
							id: callId,
							name: toolCall.name,
							args: toolCall.args,
						},
					});

					emitActivity(dependencies.runtime, {
						type: "tool_started",
						turn,
						toolName: toolCall.name,
						callId,
					});

					const result = await executeToolCall({
						registry: dependencies.registry,
						policies: dependencies.policies,
						toolName: toolCall.name,
						args: toolCall.args,
						context: parsedInput.context,
					});

					emitActivity(dependencies.runtime, {
						type: "tool_finished",
						turn,
						toolName: toolCall.name,
						callId,
						ok: result.ok,
						code: result.ok ? null : result.code,
						message: result.ok ? null : result.message,
					});

					appendMessage(history, {
						role: "tool",
						name: callId,
						content: serializeToolResult(toolCall.name, result),
					});
				}

				emitActivity(dependencies.runtime, { type: "turn_finished", turn });
			}

			return SessionResultSchema.parse({
				finalAssistantMessage: "Unable to complete request within max turns.",
				history,
				turnsUsed: dependencies.runtime.maxTurns,
				terminationReason: "max_turns",
			});
		},
	};
}

export async function runSession(input: {
	model: ModelAdapter;
	registry: ToolRegistry;
	policies: ToolPolicy[];
	runtime: RuntimeConfig;
	session: SessionInput;
}): Promise<SessionResult> {
	const runner = createSessionRunner({
		model: input.model,
		registry: input.registry,
		policies: input.policies,
		runtime: input.runtime,
	});

	return runner.run(input.session);
}
