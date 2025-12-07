import { AnimatedSpan, TypingAnimation } from "@/components/ui/shadcn-io/terminal";
import { TerminolPlugin } from "@/components/ui/terminol/terminol-registry";
import React, { useEffect, useState } from "react";

const WELCOME_ASCII = String.raw`
 _       __     __
| |     / /__  / /________  ____ ___  ___
| | /| / / _ \/ / ___/ __ \/ __ \`__ \/ _ \
| |/ |/ /  __/ / /__/ /_/ / / / / / /  __/
|__/|__/\___/_/\___/\____/_/ /_/ /_/\___/`;
const DANCE_FRAMES = [
  [
    "  o  ",
    " /|\\ ",
    "  |  ",
    " / \\ ",
  ].join("\n"),
  [
    " \\o/ ",
    "  |  ",
    "  |  ",
    " / \\ ",
  ].join("\n"),
  [
    " \\o  ",
    "  |\\ ",
    "  |  ",
    " / \\ ",
  ].join("\n"),
  [
    "  o/ ",
    " /|  ",
    "  |  ",
    " / \\ ",
  ].join("\n"),
  [
    " \\o/ ",
    "  |  ",
    "  |  ",
    " / \\ ",
  ].join("\n"),
  [
    "  o  ",
    " /|\\ ",
    "  |  ",
    " / \\ ",
  ].join("\n"),
  [
    "  o  ",
    " <|> ",
    "  |  ",
    " / \\ ",
  ].join("\n"),
  [
    " \\o  ",
    "  |\\ ",
    "  |  ",
    " / \\ ",
  ].join("\n"),
  [
    "  o/ ",
    " /|  ",
    "  |  ",
    " / \\ ",
  ].join("\n"),
];

const DanceComponent = () => {
  const [moves, setMoves] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMoves((prev) => {
        if (prev >= 8) {
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, 180);
    return () => clearInterval(interval);
  }, []);

  return (
    <pre className="font-mono leading-none whitespace-pre text-emerald-400 dark:text-amber-200">
      {DANCE_FRAMES[moves % DANCE_FRAMES.length]}
    </pre>
  );
};

export const welcomePlugin: TerminolPlugin = {
  name: "welcome",
  description: "Show welcome message",
  action: ({ print }) => {
    print(
      <div className="flex flex-row items-end gap-8">
        <div className="space-y-1 text-red-600 dark:text-red-400">
          <AnimatedSpan delay={1000}>
            {WELCOME_ASCII}
          </AnimatedSpan>
        </div>
        <DanceComponent />
      </div>
    );

    print(
      <TypingAnimation delay={1000}>
        Type "help" to see available commands
      </TypingAnimation>
    );
  },
};