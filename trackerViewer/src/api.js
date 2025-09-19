// Base host for your backend server.
// Default to localhost:3000, but allow override with Vite env var.
export const HOST = import.meta.env.VITE_HOST || "http://localhost:3000";

export const API_EVENTS = `${HOST}/events-json`;
export const SCREENSHOT_URL = `${HOST}/data/screenshots.json`;

// How far (ms) we'll search for a "close enough" screenshot to an event timestamp
export const TIME_SLOP_MS = 15_000; // 15 seconds

export async function fetchScreenshots() {
  try {
    const res = await fetch(SCREENSHOT_URL, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json(); // array of screenshots
  } catch (err) {
    console.error("Failed to fetch screenshots:", err);
    return [];
  }
}
