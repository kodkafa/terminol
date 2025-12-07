import React, { useEffect, useState } from "react";
import { TerminolPlugin, TerminolTheme } from "../core/types";
import { useTerminol } from "../core/state/context";
import { cn } from "@/lib/utils";

const HelpMessage = ({
  filterTag,
  commandName,
  theme
}: {
  filterTag?: string;
  commandName?: string;
  theme: TerminolTheme;
}) => {
  const { registry } = useTerminol();

  if (commandName) {
    const cmd = registry.resolve(commandName);
    if (!cmd) {
      return (
        <div className={theme.error || "text-red-500"}>
          Command "{commandName}" not found.
        </div>
      );
    }
    return (
      <div className="flex flex-col gap-2 mt-2">
        <div className="flex items-baseline gap-3">
          <span className={cn("text-lg font-bold", theme.success || "text-green-500")}>{cmd.name}</span>
          {cmd.tags && (
            <div className="flex gap-1">
              {cmd.tags.map(tag => (
                <span key={tag} className={cn("text-xs px-1 rounded bg-white/10", theme.muted || "text-muted-foreground")}>{tag}</span>
              ))}
            </div>
          )}
        </div>
        <div className="text-foreground">{cmd.description}</div>

        {cmd.aliases && cmd.aliases.length > 0 && (
          <div className="text-sm">
            <span className={theme.warning || "text-yellow-500"}>Aliases: </span>
            <span className={theme.muted || "text-muted-foreground"}>{cmd.aliases.join(", ")}</span>
          </div>
        )}
      </div>
    );
  }

  const commands = registry.getAll();
  const filteredCommands = filterTag
    ? commands.filter(c => c.tags?.includes(filterTag))
    : commands;

  if (filteredCommands.length === 0) {
    return (
      <div className={theme.warning || "text-amber-500"}>
        No commands found for tag "{filterTag}".
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <div className={cn("font-bold", theme.warning || "text-yellow-500")}>
        {filterTag ? `Commands tagged [${filterTag}]:` : "Available Commands:"}
      </div>
      <div className="grid grid-cols-[120px_1fr] gap-x-4 gap-y-1">
        {filteredCommands.map((cmd) => (
          <React.Fragment key={cmd.name}>
            <div className={cn("font-mono", theme.success || "text-green-500")}>{cmd.name}</div>
            <div className={theme.muted || "text-muted-foreground"}>{cmd.description}</div>
          </React.Fragment>
        ))}
      </div>
      {!filterTag && (
        <div className={cn("mt-2 text-xs", theme.muted || "text-muted-foreground")}>
          Type <span className={theme.success || "text-green-500"}>help [command]</span> for details or use <span className={theme.success || "text-green-500"}>--tag</span>.
        </div>
      )}
    </div>
  );
};

export const helpPlugin: TerminolPlugin = {
  name: "help",
  description: "List available commands",
  aliases: ["?", "man", "ls"],
  tags: ["core"],
  action: ({ print, args, theme }) => {
    let filterTag: string | undefined;
    let commandName: string | undefined;

    // Parse arguments
    // Simple parsing: if arg starts with --tag, next is tag.
    // If arg doesn't start with --, it's a command name.

    const tagIdx = args.indexOf("--tag");
    if (tagIdx !== -1 && args[tagIdx + 1]) {
      filterTag = args[tagIdx + 1];
    } else if (args.length > 0 && !args[0].startsWith("-")) {
      commandName = args[0];
    }

    print(<HelpMessage filterTag={filterTag} commandName={commandName} theme={theme} />);
  },
};
