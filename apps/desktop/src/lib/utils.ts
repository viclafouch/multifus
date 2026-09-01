import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: readonly ClassValue[]) {
  return twMerge(clsx(...inputs))
}

export const ignore = () => {}

export const errorMessage = (error: unknown) => {
  const carriesMessage =
    typeof error === 'object' && error !== null && 'message' in error

  return carriesMessage ? String(error.message) : String(error)
}
