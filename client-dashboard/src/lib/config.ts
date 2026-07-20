// Centralized config — every service URL the frontend talks to lives here.
// Add new env vars in .env.local, then reference them through this file only
// (don't read process.env directly elsewhere — keeps a single source of truth
// and makes it obvious at a glance what backends this app depends on).

export const GATEWAY_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

export const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000";

// Aditi's AI Compute Core — deepfake video, currency, voice spoof detection
export const AI_SERVICE_URL =
  process.env.NEXT_PUBLIC_AI_SERVICE_URL || "http://localhost:8000";

// Aditi's separate vernacular text/translation service
export const TEXT_SERVICE_URL =
  process.env.NEXT_PUBLIC_TEXT_SERVICE_URL || "http://localhost:8001";

// Khushboo's graph/mule-chain analytics service
export const GRAPH_SERVICE_URL =
  process.env.NEXT_PUBLIC_GRAPH_SERVICE_URL || "http://localhost:8002";

// Shared fetch timeout (ms) so a hung backend never freezes the UI forever.
export const DEFAULT_TIMEOUT_MS = 15000;
