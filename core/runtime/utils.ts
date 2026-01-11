import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function loadFromStorage(key: string): string | null {
	if (typeof window === "undefined" || !window.localStorage) return null;
	return window.localStorage.getItem(key);
}

export function saveToStorage(key: string, value: string): void {
	if (typeof window === "undefined" || !window.localStorage) return;
	window.localStorage.setItem(key, value);
}

export function removeFromStorage(key: string): void {
	if (typeof window === "undefined" || !window.localStorage) return;
	window.localStorage.removeItem(key);
}
