"use client";

import React from "react";
import { TerminolProvider, useTerminol } from "./core/state/context";
import type {
  TerminolCommandContext,
  TerminolMiddleware,
  TerminolPlugin,
  TerminolTheme,
} from "./core/types";
import { clearPlugin } from "./plugins/clear";
import { helpPlugin } from "./plugins/help";
import { TerminolAdapter } from "./ui/adapter-default";

export type TerminolProps = {
  plugins?: TerminolPlugin[];
  init?: string[]; // commands to run on startup
  prompt?: string;

  // Styling
  className?: string;
  theme?: TerminolTheme;
  header?: React.ReactNode; // [NEW] Custom header content (e.g. badges, links)

  // Options
  initialHistory?: string[];
  pluginProps?: Record<string, unknown>;
  storageKey?: string;

  // Events
  // Events
  onCommandExecuted?: (command: string, ctx: TerminolCommandContext) => void;

  // NEW
  middlewares?: TerminolMiddleware[];
};

function TerminolInner({
  className,
  header,
}: {
  className?: string;
  header?: React.ReactNode;
}) {
  const {
    outputs,
    promptLabel,
    isBusy,
    runCommand,
    historyManager,
    modal,
    overlay,
    theme,
    inputMode,
    interactivePrompt,
    abortInteractive,
    closeModal,
    hideOverlay,
    registry, // Need registry for autocompletion
  } = useTerminol();

  const [input, setInput] = React.useState("");

  const handleSubmit = (value: string) => {
    runCommand(value);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // History Navigation
    if (e.key === "ArrowUp") {
      e.preventDefault();
      const prev = historyManager.getPrevious();
      if (prev !== null) setInput(prev);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const next = historyManager.getNext();
      if (next !== null) setInput(next);
    }

    // Tab Completion
    else if (e.key === "Tab") {
      e.preventDefault();
      if (inputMode === "interactive") return; // No autocomplete in interactive mode usually

      const parts = input.trim().split(" ");
      const _currentWord = parts[parts.length - 1]; // Simply complete the last word or just the command?
      // Shell usually autocompletes the FIRST word as command, others as args (if sophisticated).
      // For now, let's just autocomplete the command if it's the first word or we are at start.

      if (parts.length <= 1) {
        const candidates = registry
          .getAll()
          .map((p) => p.name)
          .concat(registry.getAll().flatMap((p) => p.aliases || []))
          .filter((name) => name.startsWith(input));

        if (candidates.length === 1) {
          setInput(candidates[0] + " ");
        } else if (candidates.length > 1) {
          // Show suggestions?
          // Or cycle?
          // Minimal MVP: match first
          // Better: common prefix
        }
      }
    }
  };

  return (
    <TerminolAdapter
      lines={outputs}
      promptLabel={promptLabel}
      onSubmit={handleSubmit}
      isBusy={isBusy}
      className={className}
      input={input}
      setInput={setInput}
      onKeyDown={handleKeyDown}
      modal={modal}
      overlay={overlay}
      theme={theme}
      inputMode={inputMode}
      interactivePrompt={interactivePrompt}
      onAbortInteractive={abortInteractive}
      onCloseModal={closeModal}
      onHideOverlay={hideOverlay}
      header={header}
    />
  );
}

export function Terminol(props: TerminolProps) {
  const defaultPlugins = [helpPlugin, clearPlugin];
  const allPlugins = [...defaultPlugins, ...(props.plugins || [])];

  return (
    <TerminolProvider
      plugins={allPlugins}
      initialHistory={props.initialHistory}
      init={props.init}
      prompt={props.prompt}
      onCommandExecuted={props.onCommandExecuted}
      theme={props.theme}
      pluginProps={props.pluginProps}
      storageKey={props.storageKey}
      middlewares={props.middlewares}
    >
      <TerminolInner className={props.className} header={props.header} />
    </TerminolProvider>
  );
}
