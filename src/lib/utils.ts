import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Apple-Level Motion Presets
export const APPLE_SPRING = {
  type: "spring",
  stiffness: 260,
  damping: 20
}

export const APPLE_SOFT_SPRING = {
  type: "spring",
  stiffness: 100,
  damping: 15
}

export const APPLE_EASE = [0.4, 0, 0.2, 1] as const
