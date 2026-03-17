import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getURL() {
  let url = process.env.NEXT_PUBLIC_APP_URL

  // If NEXT_PUBLIC_APP_URL is not set or is localhost, and we're on Vercel, 
  // use the Vercel URL instead.
  if ((!url || url.includes('localhost')) && process.env.NEXT_PUBLIC_VERCEL_URL) {
    url = process.env.NEXT_PUBLIC_VERCEL_URL
  }

  // Fallback to localhost if nothing else is available
  url = url || 'http://localhost:3000'
  
  // Make sure to include `https://` when not localhost.
  url = url.startsWith('http') ? url : `https://${url}`
  // Remove trailing slash
  url = url.endsWith('/') ? url.slice(0, -1) : url
  return url
}
