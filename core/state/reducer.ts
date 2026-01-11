import type { TerminolAction, TerminolState } from "../types";

export const initialTerminolState: TerminolState = {
	history: [],
	outputs: [],
	isBusy: false,
	promptLabel: "user@term:~$ ",
	inputMode: "normal",
	interactivePrompt: null,
	modal: null,
	overlay: null,
};

export function terminolReducer(
	state: TerminolState,
	action: TerminolAction,
): TerminolState {
	switch (action.type) {
		case "SET_BUSY":
			return { ...state, isBusy: action.payload as boolean };

		case "ADD_HISTORY":
			// Clean up history to remove duplicates or limit size if needed
			// For now just append
			if (!(action.payload as string).trim()) return state;
			return {
				...state,
				history: [...state.history, action.payload as string],
			};

		case "REPLACE_HISTORY":
			return { ...state, history: action.payload as string[] };

		case "APPEND_OUTPUT":
			// biome-ignore lint/suspicious/noExplicitAny: complex react node
			return { ...state, outputs: [...state.outputs, action.payload as any] };

		case "CLEAR_OUTPUT":
			return { ...state, outputs: [] };

		case "SET_PROMPT_LABEL":
			return { ...state, promptLabel: action.payload as string };

		case "SET_INPUT_MODE":
			return {
				...state,
				// biome-ignore lint/suspicious/noExplicitAny: complex payload
				inputMode: (action.payload as any).mode,
				// biome-ignore lint/suspicious/noExplicitAny: complex payload
				interactivePrompt: (action.payload as any).prompt ?? null,
			};

		case "ENTER_INTERACTIVE":
			return {
				...state,
				inputMode: "interactive",
				// biome-ignore lint/suspicious/noExplicitAny: complex payload
				interactivePrompt: (action.payload as any).prompt,
				isBusy: false, // interactive: NOT busy
			};

		case "EXIT_INTERACTIVE":
			return {
				...state,
				inputMode: "normal",
				interactivePrompt: null,
			};

		case "ABORT_INTERACTIVE":
			return {
				...state,
				inputMode: "normal",
				interactivePrompt: null,
				isBusy: false,
			};

		case "OPEN_MODAL":
			// biome-ignore lint/suspicious/noExplicitAny: complex react node
			return { ...state, modal: action.payload as any };

		case "CLOSE_MODAL":
			return { ...state, modal: null };

		case "SHOW_OVERLAY":
			// biome-ignore lint/suspicious/noExplicitAny: complex react node
			return { ...state, overlay: action.payload as any };

		case "HIDE_OVERLAY":
			return { ...state, overlay: null };

		case "LOAD_STATE":
			// biome-ignore lint/suspicious/noExplicitAny: complex state
			return { ...state, ...(action.payload as any) };

		default:
			return state;
	}
}
