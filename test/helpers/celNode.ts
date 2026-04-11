import type { Node, TextInputNode } from "@cel-tui/core";

export function findTextInput(node: Node): TextInputNode | null {
	if (node.type === "textinput") {
		return node;
	}

	if (node.type === "text") {
		return null;
	}

	for (const child of node.children) {
		const found = findTextInput(child);
		if (found !== null) {
			return found;
		}
	}

	return null;
}
