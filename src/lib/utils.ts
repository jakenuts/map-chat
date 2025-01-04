import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// API key is loaded from environment variables
export const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY;
