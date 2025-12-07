import type React from "react";

export interface TerminolTheme {
  // Semantic tokens mapped to colors
  container?: string;
  line?: string;
  prompt?: string;
  input?: string;
  cursor?: string;

  // Semantic States
  success?: string; // e.g. text-green-500
  error?: string; // e.g. text-red-500
  warning?: string; // e.g. text-yellow-500
  info?: string; // e.g. text-blue-500
  muted?: string; // e.g. text-gray-500
  accent?: string; // e.g. text-cyan-500

  // UI Components
  overlay?: string;
  modal?: string;
}

// ----------------------------------------------------------------------------
// Command & Plugin Definitions
// ----------------------------------------------------------------------------

export type TerminolPluginCategory =
  | "core"
  | "system"
  | "user"
  | "demo"
  | "content";

export interface TerminolPlugin {
  name: string; // primary command name
  description: string; // text shown in `help`
  aliases?: string[]; // alternative names
  tags?: string[]; // e.g. ["code", "system"]
  category?: TerminolPluginCategory; // grouping for help
  hidden?: boolean; // hide from help if true

  // Optional UI component (advanced usage: overlays, modals, etc.)
  component?: React.ComponentType<unknown>;

  // Main execution hook
  action?: (ctx: TerminolCommandContext) => Promise<void> | void;
}

export type TerminolMiddleware = (
  command: string,
  ctx: TerminolCommandContext,
) => void | Promise<void>;

// ----------------------------------------------------------------------------
// Execution Context
// ----------------------------------------------------------------------------

export interface TerminolCommandContext {
  // Parsed input
  raw: string;
  command: string;
  args: string[];

  // Output & prompt control
  print: (content: React.ReactNode) => void;
  clear: () => void;
  setPrompt: (prompt: string) => void;

  // Execution
  execute: (command: string, options?: { silent?: boolean }) => Promise<void>; // Programmatic execution

  // Advanced UI
  openModal: (content: React.ReactNode, options?: ModalOptions) => void;
  closeModal: () => void;
  showOverlay: (content: React.ReactNode, options?: OverlayOptions) => void;
  hideOverlay: () => void;

  // Interactive input
  prompt: (options?: PromptOptions) => Promise<string>;
  setInputHandler: (
    handler: ((input: string) => Promise<boolean> | boolean) | null,
    options?: { prompt?: string },
  ) => void;
  abortInteractive: () => void;

  // Runtime options / configuration
  theme: TerminolTheme;
  props: Record<string, unknown>; // for plugin-specific configuration
}

// ----------------------------------------------------------------------------
// UI / Interaction Options
// ----------------------------------------------------------------------------

export interface ModalOptions {
  title?: string;
  size?: "sm" | "md" | "lg" | "full";
}

export interface OverlayOptions {
  id?: string;
  dismissOnEsc?: boolean;
  dismissOnBackground?: boolean;
}

export interface PromptOptions {
  label?: string;
  placeholder?: string;
  secret?: boolean; // e.g. for password input
}

// ----------------------------------------------------------------------------
// State
// ----------------------------------------------------------------------------

export type InputMode = "normal" | "interactive";

export interface TerminolState {
  history: string[]; // command history
  outputs: React.ReactNode[]; // rendered lines
  isBusy: boolean; // async command in progress
  promptLabel: string; // current prompt label (normal mode)

  // Interactive mode
  inputMode: InputMode;
  interactivePrompt: string | null; // prompt to show when waiting for input

  // UI State
  modal: React.ReactNode | null;
  overlay: React.ReactNode | null;
}

export interface TerminolAction {
  type: string;
  payload?: unknown;
}
