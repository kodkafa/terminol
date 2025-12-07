import { TerminolState, TerminolAction } from "../types";

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

export function terminolReducer(state: TerminolState, action: TerminolAction): TerminolState {
  switch (action.type) {
    case "SET_BUSY":
      return { ...state, isBusy: action.payload };
    
    case "ADD_HISTORY":
      // Clean up history to remove duplicates or limit size if needed
      // For now just append
      if (!action.payload.trim()) return state;
      return { ...state, history: [...state.history, action.payload] };

    case "REPLACE_HISTORY":
        return { ...state, history: action.payload };

    case "APPEND_OUTPUT":
      return { ...state, outputs: [...state.outputs, action.payload] };

    case "CLEAR_OUTPUT":
      return { ...state, outputs: [] };

    case "SET_PROMPT_LABEL":
      return { ...state, promptLabel: action.payload };

    case "SET_INPUT_MODE":
      return { 
        ...state, 
        inputMode: action.payload.mode,
        interactivePrompt: action.payload.prompt ?? null 
      };

    case "ENTER_INTERACTIVE":
      return {
        ...state,
        inputMode: "interactive",
        interactivePrompt: action.payload.prompt,
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
      return { ...state, modal: action.payload };
    
    case "CLOSE_MODAL":
      return { ...state, modal: null };
      
    case "SHOW_OVERLAY":
      return { ...state, overlay: action.payload };
    
    case "HIDE_OVERLAY":
      return { ...state, overlay: null };

    case "LOAD_STATE":
      return { ...state, ...action.payload };

    default:
      return state;
  }
}
