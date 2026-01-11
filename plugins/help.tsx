import React from "react";
import { cn } from "@/lib/utils";
import { useTerminol } from "../core/state/context";
import type { TerminolPlugin, TerminolTheme } from "../core/types";

const InteractiveHelpMessage = ({
  filterTag,
  commandName,
  theme,
  onSelect,
  onExit,
}: {
  filterTag?: string;
  commandName?: string;
  theme: TerminolTheme;
  onSelect: (cmd: string) => void;
  onExit: () => void;
}) => {
  const { registry } = useTerminol();
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [isActive, setIsActive] = React.useState(true);

  // If commandName is present, we show detail view (no interaction needed basically, or just escape to go back?)
  // For now, if commandName is present, we just render the static view.
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
          <span
            className={cn("text-lg font-bold", theme.success || "text-green-500")}
          >
            {cmd.name}
          </span>
          {cmd.tags && (
            <div className="flex gap-1">
              {cmd.tags.map((tag) => (
                <span
                  key={tag}
                  className={cn(
                    "text-xs px-1 rounded bg-white/10",
                    theme.muted || "text-muted-foreground",
                  )}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="text-foreground">{cmd.description}</div>

        {cmd.aliases && cmd.aliases.length > 0 && (
          <div className="text-sm">
            <span className={theme.warning || "text-yellow-500"}>Aliases: </span>
            <span className={theme.muted || "text-muted-foreground"}>
              {cmd.aliases.join(", ")}
            </span>
          </div>
        )}
      </div>
    );
  }

  const commands = registry.getAll();
  const filteredCommands = filterTag
    ? commands.filter((c) => c.tags?.includes(filterTag))
    : commands;

  const ITEMS_PER_PAGE = 10;
  const [currentPage, setCurrentPage] = React.useState(0);
  const totalPages = Math.ceil(filteredCommands.length / ITEMS_PER_PAGE);

  const pageCommands = React.useMemo(() => {
    const start = currentPage * ITEMS_PER_PAGE;
    return filteredCommands.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredCommands, currentPage]);

  const handleSelect = (idx: number) => {
    setIsActive(false);
    onSelect(pageCommands[idx].name);
  };

  React.useEffect(() => {
    if (!isActive || filteredCommands.length === 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        [
          "ArrowUp",
          "ArrowDown",
          "ArrowLeft",
          "ArrowRight",
          "Enter",
          "Escape",
          " ",
        ].includes(e.key)
      ) {
        e.preventDefault();
        e.stopPropagation();
      } else {
        return;
      }

      switch (e.key) {
        case "ArrowUp":
          setSelectedIndex((prev) =>
            prev > 0 ? prev - 1 : pageCommands.length - 1,
          );
          break;
        case "ArrowDown":
          setSelectedIndex((prev) =>
            prev < pageCommands.length - 1 ? prev + 1 : 0,
          );
          break;
        case "ArrowLeft":
          if (currentPage > 0) {
            setCurrentPage((p) => p - 1);
            setSelectedIndex(0);
          }
          break;
        case "ArrowRight":
          if (currentPage < totalPages - 1) {
            setCurrentPage((p) => p + 1);
            setSelectedIndex(0);
          }
          break;
        case "Enter":
        case " ":
          handleSelect(selectedIndex);
          break;
        case "Escape":
          setIsActive(false);
          onExit();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown, { capture: true });
    return () => {
      window.removeEventListener("keydown", handleKeyDown, { capture: true });
    };
  }, [isActive, selectedIndex, pageCommands, currentPage, totalPages]); // Dependencies updated

  if (filteredCommands.length === 0) {
    React.useEffect(() => {
      onExit();
    }, []);

    return (
      <div className={theme.warning || "text-amber-500"}>
        No commands found for tag "{filterTag}".
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between items-center">
        <div className={cn("font-bold", theme.warning || "text-yellow-500")}>
          {filterTag
            ? `Commands tagged [${filterTag}]:`
            : "Available Commands:"}
        </div>
        {totalPages > 1 && (
          <div
            className={cn("text-xs", theme.muted || "text-muted-foreground")}
          >
            Page {currentPage + 1}/{totalPages}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1 min-h-[220px]">
        {pageCommands.map((cmd, index) => {
          const isSelected = isActive && index === selectedIndex;
          return (
            <div
              key={cmd.name}
              className={cn(
                "grid grid-cols-[20px_120px_1fr] gap-x-2 p-0.5 cursor-pointer transition-colors",
                isSelected ? "bg-white/10" : "",
              )}
              onMouseEnter={() => {
                if (isActive) setSelectedIndex(index);
              }}
              onClick={() => {
                if (isActive) handleSelect(index);
              }}
            >
              <div
                className={cn(
                  "text-center font-bold",
                  isSelected
                    ? theme.accent || "text-cyan-500"
                    : "opacity-0",
                )}
              >
                {">"}
              </div>
              <div
                className={cn(
                  "font-mono",
                  isSelected
                    ? theme.accent || "text-cyan-500"
                    : theme.success || "text-green-500",
                )}
              >
                {cmd.name}
              </div>
              <div className={theme.muted || "text-muted-foreground"}>
                {cmd.description}
              </div>
            </div>
          );
        })}
      </div>
      {!filterTag && (
        <div
          className={cn(
            "mt-2 text-xs opacity-50",
            theme.muted || "text-muted-foreground",
          )}
        >
          <div className="flex gap-4">
            <span>↑/↓ navigate</span>
            {totalPages > 1 && <span>←/→ page</span>}
            <span>↵ select</span>
            <span>esc exit</span>
          </div>
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
  action: ({ print, args, theme, execute, setInputHandler, setPrompt }) => {
    let filterTag: string | undefined;
    let commandName: string | undefined;

    const tagIdx = args.indexOf("--tag");
    if (tagIdx !== -1 && args[tagIdx + 1]) {
      filterTag = args[tagIdx + 1];
    } else if (args.length > 0 && !args[0].startsWith("-")) {
      commandName = args[0];
    }

    const defaultPrompt = "user@kodkafa:~$ ";

    // If we are showing a list (no specific command), enable interaction
    if (!commandName) {
       setPrompt(""); 
       setInputHandler(async () => true, { prompt: "" });

       const onSelect = async (cmdName: string) => {
           setPrompt(defaultPrompt);
           setInputHandler(null);
           
           if(cmdName) {
             // Execute the command directly
             await execute(cmdName);
           }
       };

       const onExit = () => {
           setPrompt(defaultPrompt);
           setInputHandler(null);
       };

       print(
        <InteractiveHelpMessage
          filterTag={filterTag}
          commandName={commandName}
          theme={theme}
          onSelect={onSelect}
          onExit={onExit}
        />
      );
    } else {
        // Just print details, no interaction needed
        print(
          <InteractiveHelpMessage
            filterTag={filterTag}
            commandName={commandName}
            theme={theme}
            onSelect={() => {}} 
            onExit={() => {}}
          />
        );
    }
  },
};
