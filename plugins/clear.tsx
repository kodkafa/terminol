import type { TerminolPlugin } from "../core/types";

export const clearPlugin: TerminolPlugin = {
  name: "clear",
  description: "Clear the terminal output",
  aliases: ["cls"],
  action: ({ clear }) => {
    clear();
  },
};
