"use client";

import type React from "react";
import { useEffect, useRef } from "react";
import { Terminal } from "@/components/ui/shadcn-io/terminal";
import { cn } from "@/lib/utils";
import type { InputMode, TerminolTheme } from "../core/types";

export interface TerminolAdapterProps {
  lines: React.ReactNode[];
  promptLabel: string;
  onSubmit: (value: string) => void;
  isBusy?: boolean;
  className?: string;
  input: string;
  setInput: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  modal?: React.ReactNode | null;
  overlay?: React.ReactNode | null;
  theme?: TerminolTheme;
  inputMode?: InputMode;
  interactivePrompt?: string | null;
  onAbortInteractive?: () => void;
  onCloseModal?: () => void;
  onHideOverlay?: () => void;
  header?: React.ReactNode;
}

export function TerminolAdapter({
  lines,
  promptLabel,
  onSubmit,
  isBusy,
  className,
  input,
  setInput,
  onKeyDown,
  modal,
  overlay,
  theme,
  inputMode = "normal",
  interactivePrompt,
  onAbortInteractive,
  onCloseModal,
  onHideOverlay,
  header,
}: TerminolAdapterProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  // biome-ignore lint/correctness/useExhaustiveDependencies: auto-scroll on lines/input change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines, input]);

  // ESC to close modal/overlay
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        let handled = false;

        if (overlay) {
          onHideOverlay?.();
          handled = true;
        }

        if (modal) {
          onCloseModal?.();
          handled = true;
        }

        if (handled) {
          e.preventDefault();
        }
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [modal, overlay, onCloseModal, onHideOverlay]);

  // Keep focus on input
  // biome-ignore lint/correctness/useExhaustiveDependencies: focus logic
  useEffect(() => {
    if (!modal && !overlay) {
      // Small timeout to ensure DOM is ready and disabled state is cleared
      const timeout = setTimeout(() => {
        inputRef.current?.focus();
      }, 10);
      return () => clearTimeout(timeout);
    }
  }, [isBusy, lines, modal, overlay]); // isBusy dep kept for reactivity but logic simplified

  // Focus input on click
  const handleContainerClick = () => {
    if (!modal && !overlay) {
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (onKeyDown) onKeyDown(e);

    // Ctrl+Q to abort interactive mode
    if (e.ctrlKey && e.key === "q") {
      e.preventDefault();
      onAbortInteractive?.();
      return;
    }

    // Allow submit even if busy (for interactive inputs)
    // The provider/handler logic determines if it's safe to process
    if (e.key === "Enter") {
      onSubmit(input);
    }
  };

  const currentPrompt =
    inputMode === "interactive" ? interactivePrompt || ">" : promptLabel;

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: terminal click-to-focus behavior
    // biome-ignore lint/a11y/noStaticElementInteractions: terminal container interaction
    <div
      className={cn(
        "h-full w-full relative bg-background text-foreground overflow-hidden",
        theme?.container,
        className,
      )}
      onClick={handleContainerClick}
    >
      {overlay && (
        <div
          className={cn(
            "fixed inset-0 z-[100] flex items-center justify-center bg-background/90 backdrop-blur-sm",
            theme?.overlay,
          )}
        >
          {overlay}
        </div>
      )}

      {modal && (
        <div
          className={cn(
            "absolute inset-0 z-[50] flex items-center justify-center bg-background/70 backdrop-blur-sm",
            theme?.modal,
          )}
        >
          <div className="bg-popover text-popover-foreground border border-border p-4 rounded-md shadow-lg max-w-2xl w-full max-h-[80%] overflow-auto">
            {modal}
          </div>
        </div>
      )}

      {header && (
        <div className="absolute top-0 right-0 z-[20] h-10 pr-2 flex items-center pointer-events-none">
          {/* Wrapper div to position header items correctly, pointer-events-none to let clicks pass through to terminal unless hitting the header items themselves */}
          <div className="pointer-events-auto">{header}</div>
        </div>
      )}

      <Terminal
        className={cn(
          "h-full max-h-none w-full max-w-none rounded-none border-none bg-background overflow-hidden flex flex-col",
          "[&_pre]:flex-1 [&_pre]:min-h-0 [&_pre]:overflow-hidden [&_pre]:p-0",
          "[&_code]:h-full [&_code]:block [&_code]:overflow-hidden [&_code]:p-0",
          theme?.container,
        )}
      >
        <div
          ref={scrollRef}
          className="h-full w-full overflow-y-auto p-4 pb-12"
        >
          {lines.map((line, i) => (
            <div
              // biome-ignore lint/suspicious/noArrayIndexKey: simple string lines
              key={i}
              className={cn("whitespace-pre-wrap break-words", theme?.line)}
            >
              {line}
            </div>
          ))}

          <div className="flex flex-row items-center gap-2">
            <span
              className={cn(
                "whitespace-nowrap font-bold",
                inputMode === "interactive"
                  ? theme?.warning || "text-warning"
                  : theme?.prompt || "text-primary",
              )}
            >
              {currentPrompt}
            </span>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className={cn(
                "flex-1 bg-transparent border-none outline-none text-inherit font-inherit placeholder:text-muted-foreground",
                theme?.input,
              )}
              disabled={!!modal || !!overlay}
              // biome-ignore lint/a11y/noAutofocus: terminal requires autofocus
              autoFocus
              autoComplete="off"
            />
          </div>
        </div>
      </Terminal>
    </div>
  );
}
