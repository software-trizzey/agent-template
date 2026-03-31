import type {
	RuntimeConfigData,
	SessionInput,
	SessionResult,
	SessionState,
	SessionTerminationReason,
} from "../schemas/runtime";
import type { ActivityEvent } from "./activity";

export type RuntimeConfig = RuntimeConfigData & {
	onActivity?: (event: ActivityEvent) => void;
};

export type {
	SessionInput,
	SessionResult,
	SessionState,
	SessionTerminationReason,
};
