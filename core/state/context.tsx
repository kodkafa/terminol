"use client";

import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useReducer,
	useRef,
} from "react";
import { CommandRegistry } from "../runtime/command-registry";
import { HistoryManager } from "../runtime/history";
import { parseCommand } from "../runtime/parser";
import { loadFromStorage, saveToStorage } from "../runtime/utils";
import type {
	ModalOptions,
	OverlayOptions,
	PromptOptions,
	TerminolCommandContext,
	TerminolMiddleware,
	TerminolPlugin,
	TerminolState,
	TerminolTheme,
} from "../types";
import { initialTerminolState, terminolReducer } from "./reducer";

interface TerminolContextType extends TerminolState {
	runCommand: (line: string) => Promise<void>;
	clear: () => void;
	setPrompt: (prompt: string) => void;
	historyManager: HistoryManager;
	registry: CommandRegistry;

	// Advanced Capabilities
	openModal: (content: ReactNode, options?: ModalOptions) => void;
	closeModal: () => void;
	showOverlay: (content: ReactNode, options?: OverlayOptions) => void;
	hideOverlay: () => void;
	promptUser: (options?: PromptOptions) => Promise<string>;
	setInputHandler: (
		handler: ((input: string) => Promise<boolean> | boolean) | null,
	) => void;
	abortInteractive: () => void;

	// Theme & Config
	theme?: TerminolTheme;
}

const TerminolContext = createContext<TerminolContextType | undefined>(
	undefined,
);

export function useTerminol() {
	const context = useContext(TerminolContext);
	if (!context) {
		throw new Error("useTerminol must be used within a TerminolProvider");
	}
	return context;
}

interface TerminolProviderProps {
	children: ReactNode;
	plugins?: TerminolPlugin[];
	initialHistory?: string[];
	init?: string[];
	prompt?: string;
	onCommandExecuted?: (command: string, ctx: TerminolCommandContext) => void;
	theme?: TerminolTheme;
	pluginProps?: Record<string, unknown>;
	storageKey?: string; // Prefix for localStorage keys
	middlewares?: TerminolMiddleware[];
}

export function TerminolProvider({
	children,
	plugins = [],
	initialHistory = [],
	init = [],
	prompt: initialPrompt = "user@term:~$ ",
	onCommandExecuted,
	theme,
	pluginProps = {},
	storageKey = "terminol",
	middlewares = [],
}: TerminolProviderProps) {
	// Runtime Dependencies (Memoized)
	const historyRef = useRef<HistoryManager>(new HistoryManager(initialHistory));
	const registryRef = useRef<CommandRegistry>(new CommandRegistry(plugins));
	const inputHandlersRef = useRef<
		Array<(input: string) => Promise<boolean> | boolean>
	>([]);

	// Reducer State
	const [state, dispatch] = useReducer(terminolReducer, {
		...initialTerminolState,
		promptLabel: initialPrompt,
		history: initialHistory,
	});

	// Load Persistence on Mount
	// Load Persistence on Mount (ONCE)
	const initializedEffect = useRef(false);

	// biome-ignore lint/correctness/useExhaustiveDependencies: run once
	useEffect(() => {
		if (initializedEffect.current) return;
		initializedEffect.current = true;

		try {
			const savedHistory = loadFromStorage(`${storageKey}:history`);
			// Merge initial history provided by props with saved history
			let merged = initialHistory ? [...initialHistory] : [];

			if (savedHistory) {
				const parsed = JSON.parse(savedHistory);
				if (Array.isArray(parsed)) {
					merged = Array.from(new Set([...merged, ...parsed]));
				}
			}

			if (merged.length > 0) {
				historyRef.current = new HistoryManager(merged);
				dispatch({ type: "REPLACE_HISTORY", payload: merged });
			}
		} catch (e) {
			console.error("Failed to load history:", e);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []); // Run once on mount

	// Persist History on Change
	useEffect(() => {
		if (state.history.length > 0) {
			saveToStorage(`${storageKey}:history`, JSON.stringify(state.history));
		}
	}, [state.history, storageKey]);

	// APIs
	const print = useCallback((content: ReactNode) => {
		dispatch({ type: "APPEND_OUTPUT", payload: content });
	}, []);

	const clear = useCallback(() => {
		dispatch({ type: "CLEAR_OUTPUT" });
	}, []);

	const setPrompt = useCallback((prompt: string) => {
		dispatch({ type: "SET_PROMPT_LABEL", payload: prompt });
	}, []);

	const openModal = useCallback(
		(content: ReactNode, _options?: ModalOptions) => {
			dispatch({ type: "OPEN_MODAL", payload: content });
		},
		[],
	);

	const closeModal = useCallback(() => {
		dispatch({ type: "CLOSE_MODAL" });
	}, []);

	const showOverlay = useCallback(
		(content: ReactNode, _options?: OverlayOptions) => {
			dispatch({ type: "SHOW_OVERLAY", payload: content });
		},
		[],
	);

	const hideOverlay = useCallback(() => {
		dispatch({ type: "HIDE_OVERLAY" });
	}, []);

	const setInputHandler = useCallback(
		(
			handler: ((input: string) => Promise<boolean> | boolean) | null,
			options?: { prompt?: string },
		) => {
			if (handler) {
				inputHandlersRef.current.push(handler);
				dispatch({
					type: "ENTER_INTERACTIVE",
					payload: {
						handler, // Kept in state? (User suggestion, but we use Ref stack)
						prompt: options?.prompt ?? "> ",
					},
				});
			} else {
				inputHandlersRef.current.pop(); // Remove top handler
				if (inputHandlersRef.current.length === 0) {
					dispatch({ type: "EXIT_INTERACTIVE" });
				} else {
					// Revert to previous handler prompt? tricky if we don't store prompt stack.
					// For now, assume if we pop, we might still be interactive if stack > 0,
					// but we don't know the previous prompt.
					// Simplified: if stack > 0, keep interactive mode but maybe default prompt?
					// ideally we should store { handler, prompt } in stack.
				}
			}
		},
		[],
	);

	const abortInteractive = useCallback(() => {
		// Clear all handlers or just top? Usually 'abort' means stop interaction.
		inputHandlersRef.current = [];
		dispatch({ type: "ABORT_INTERACTIVE" });
		print(<div className="text-muted-foreground italic">^C</div>);
	}, [print]);

	const promptUser = useCallback(
		async (options?: PromptOptions) => {
			return new Promise<string>((resolve) => {
				dispatch({
					type: "SET_INPUT_MODE",
					payload: {
						mode: "interactive",
						prompt: options?.label ?? "> ",
					},
				});

				const handler = (input: string) => {
					// Resolve the promise with input
					resolve(input);
					// Pop this handler (set null)
					setInputHandler(null);
					// Return true to indicate handled
					return true;
				};

				setInputHandler(handler, { prompt: options?.label ?? "> " });
			});
		},
		[setInputHandler],
	);

	const runCommand = useCallback(
		async (line: string, options?: { silent?: boolean }) => {
			// 1. Check Input Interception
			const activeHandler =
				inputHandlersRef.current[inputHandlersRef.current.length - 1];

			// Echo input (unless secret? - secret handling involves ui adapter not showing it)
			// For now we always echo unless plugin handles it nicely?
			// Usually interactive prompts echo what you type.
			// If it's a "password" prompt, UI adapter handles masking.

			// If interactive mode, we might handle echoing differently?
			// Current design: Adapter handles input field. user hits enter.

			if (activeHandler) {
				// In interactive mode, we usually don't print the prompt+command to output log
				// in the same way as main shell, but let's see.
				// If promptUser was called, we show "Prompt: value" maybe?
				// For now, let's just let the handler decide or simple echo.

				const handled = await activeHandler(line);
				if (handled) return;
			}

			if (!line.trim()) return;

			// Normal Command Execution
			if (!options?.silent) {
				historyRef.current.add(line);
				dispatch({ type: "ADD_HISTORY", payload: line });

				// Echo command
				dispatch({
					type: "APPEND_OUTPUT",
					payload: (
						<div key={Date.now() + "-cmd"} className="flex flex-row gap-2">
							<span
								className={
									state.inputMode === "interactive"
										? "text-amber-500"
										: "text-muted-foreground"
								}
							>
								{state.inputMode === "interactive"
									? state.interactivePrompt || ">"
									: state.promptLabel}
							</span>
							<span>{line}</span>
						</div>
					),
				});
			}

			dispatch({ type: "SET_BUSY", payload: true });

			const { command, args } = parseCommand(line);
			const plugin = registryRef.current.resolve(command);

			// Inject plugin specific props
			const specificProps =
				(pluginProps[command] as Record<string, unknown>) || {};

			const ctx: TerminolCommandContext = {
				raw: line,
				command,
				args,
				print,
				clear,
				setPrompt,
				execute: runCommand, // Expose runCommand as execute
				openModal,
				closeModal,
				showOverlay,
				hideOverlay,
				prompt: promptUser,
				setInputHandler,
				abortInteractive,
				theme: theme || {},
				props: specificProps,
			};

			try {
				if (plugin?.action) {
					await plugin.action(ctx);
				} else {
					print(
						<span className="text-red-500">
							Command not found: {command}. Type "help" for available commands.
						</span>,
					);
				}

				// Legacy callback
				if (onCommandExecuted) {
					onCommandExecuted(command, ctx);
				}

				// Middleware Chain
				if (middlewares.length > 0) {
					for (const middleware of middlewares) {
						// eslint-disable-next-line no-await-in-loop
						await middleware(command, ctx);
					}
				}
			} catch (err: unknown) {
				const message = err instanceof Error ? err.message : String(err);
				print(<span className="text-red-500">Error: {message}</span>);
			} finally {
				dispatch({ type: "SET_BUSY", payload: false });
			}
		},
		[
			onCommandExecuted,
			abortInteractive,
			theme,
			pluginProps,
			print,
			clear,
			setPrompt,
			openModal,
			closeModal,
			showOverlay,
			hideOverlay,
			promptUser,
			setInputHandler,
			state.inputMode,
			state.interactivePrompt,
			state.promptLabel,
			middlewares,
		],
	);

	// Handle Init
	const initialized = useRef(false);
	useEffect(() => {
		if (!initialized.current && init.length > 0) {
			initialized.current = true;
			const runInit = async () => {
				for (const cmd of init) {
					await runCommand(cmd, { silent: true });
				}
			};
			runInit();
		}
	}, [init, runCommand]);

	const value: TerminolContextType = {
		...state,
		runCommand,
		clear,
		setPrompt,
		historyManager: historyRef.current,
		registry: registryRef.current,
		openModal,
		closeModal,
		showOverlay,
		hideOverlay,
		promptUser,
		setInputHandler,
		abortInteractive,
		theme,
	};

	return (
		<TerminolContext.Provider value={value}>
			{children}
		</TerminolContext.Provider>
	);
}
