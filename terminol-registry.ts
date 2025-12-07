// This file is intended to be used by the registry build script
// to generate the JSON registry.
// It can also export helper functions for consumers to register plugins.

import type { TerminolPlugin } from "./core/types";

export function createPlugin(plugin: TerminolPlugin): TerminolPlugin {
  return plugin;
}

// Re-export core types for easier access
export * from "./core/types";
