import type {
  Incident,
  IncidentsResponse,
  DeepfakeResult,
  CurrencyResult,
  VoiceResult,
  ScamTextResult,
  SupportedLangCode,
  MuleTraceResult,
} from "./types";
import {
  GATEWAY_URL,
  AI_SERVICE_URL,
  TEXT_SERVICE_URL,
  GRAPH_SERVICE_URL,
  DEFAULT_TIMEOUT_MS,
} from "./config";

export class ApiUnreachableError extends Error {
  constructor(message = "Backend API is not reachable") {
    super(message);
    this.name = "ApiUnreachableError";
  }
}

// Every request goes through here so timeouts, abort handling, and error
// shape are consistent no matter which backend service is being called.
async function request<T>(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      cache: "no-store",
      credentials: "include",
    });

    if (!res.ok) {
      let detail = "";
      try {
        const body = await res.json();
        detail = body?.error || body?.detail || "";
      } catch {
        // response wasn't JSON, ignore
      }
      throw new Error(detail || `Request failed: ${res.status}`);
    }

    return (await res.json()) as T;
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new ApiUnreachableError("Request timed out — the service took too long to respond.");
    }
    if (err instanceof TypeError) {
      // fetch throws TypeError on network failure (service down, CORS, etc.)
      throw new ApiUnreachableError();
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

// ---------------------------------------------------------------------------
// Incidents (Payal's gateway) — unchanged behavior, now routed through request()
// ---------------------------------------------------------------------------

export async function fetchIncidents(params?: {
  page?: number;
  limit?: number;
}): Promise<IncidentsResponse | null> {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));

  try {
    return await request<IncidentsResponse>(
      `${GATEWAY_URL}/api/v1/incidents${query.toString() ? `?${query}` : ""}`
    );
  } catch (err) {
    console.error("Failed to reach gateway for /api/v1/incidents:", err);
    return null;
  }
}

export async function fetchIncidentById(id: string): Promise<Incident | null> {
  try {
    return await request<Incident>(`${GATEWAY_URL}/api/v1/incident/${id}`);
  } catch (err) {
    console.error(`Failed to reach gateway for /api/v1/incident/${id}:`, err);
    return null;
  }
}

export async function submitIncidentReport(payload: {
  session_uuid: string;
  citizen_phone_hash: string;
  incidentType: string;
  location: { lat: number; lng: number };
  [key: string]: unknown;
}): Promise<Incident> {
  return request<Incident>(`${GATEWAY_URL}/api/v1/incident`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

// ---------------------------------------------------------------------------
// Deepfake video analysis (Aditi — AI_SERVICE_URL, up to 300MB, can be slow)
// ---------------------------------------------------------------------------

export async function analyzeDeepfake(file: File): Promise<DeepfakeResult> {
  const formData = new FormData();
  formData.append("file", file);
  // Video inference can take a while — use a longer timeout than the default.
  return request<DeepfakeResult>(
    `${AI_SERVICE_URL}/api/v1/ai/analyze/deepfake`,
    { method: "POST", body: formData },
    60000
  );
}

// ---------------------------------------------------------------------------
// Currency authenticity check (Aditi — AI_SERVICE_URL)
// ---------------------------------------------------------------------------

export async function analyzeCurrency(file: File): Promise<CurrencyResult> {
  const formData = new FormData();
  formData.append("file", file);
  return request<CurrencyResult>(
    `${AI_SERVICE_URL}/api/v1/ai/analyze/currency`,
    { method: "POST", body: formData },
    30000
  );
}

// ---------------------------------------------------------------------------
// Voice spoof detection (Aditi — AI_SERVICE_URL)
// ---------------------------------------------------------------------------

export async function analyzeVoice(file: File): Promise<VoiceResult> {
  const formData = new FormData();
  formData.append("file", file);
  return request<VoiceResult>(
    `${AI_SERVICE_URL}/api/v1/ai/analyze/voice`,
    { method: "POST", body: formData },
    30000
  );
}

// ---------------------------------------------------------------------------
// Vernacular scam-text analysis (Aditi — TEXT_SERVICE_URL, separate port)
// ---------------------------------------------------------------------------

export async function analyzeScamText(
  text: string,
  langCode: SupportedLangCode,
  sessionUuid?: string
): Promise<ScamTextResult> {
  return request<ScamTextResult>(
    `${TEXT_SERVICE_URL}/api/v1/ai/analyze/text`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_uuid: sessionUuid || crypto.randomUUID(),
        text,
        lang_code: langCode,
      }),
    },
    20000
  );
}

// ---------------------------------------------------------------------------
// Mule chain trace (Khushboo — GRAPH_SERVICE_URL)
// ---------------------------------------------------------------------------

export async function traceMuleChains(params?: {
  account_number?: string;
  max_accounts_to_check?: number;
  max_results?: number;
}): Promise<MuleTraceResult> {
  return request<MuleTraceResult>(
    `${GRAPH_SERVICE_URL}/api/v1/graph/trace-mule`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params || {}),
    },
    20000
  );
}

// ---------------------------------------------------------------------------
// Health checks — used by the sidebar / tool pages to show per-service status
// instead of letting one dead backend take down the whole dashboard.
// ---------------------------------------------------------------------------

export async function checkServiceHealth(url: string): Promise<boolean> {
  try {
    await request(`${url}/api/v1/health`, {}, 4000);
    return true;
  } catch {
    try {
      // some services expose /health instead of /api/v1/health
      await request(`${url}/health`, {}, 4000);
      return true;
    } catch {
      return false;
    }
  }
}

// ---------------------------------------------------------------------------
// Case management — requires a new backend route from Payal:
//   PATCH /api/v1/incident/:id  { case_status?, assigned_officer? }
// Not implemented on the gateway yet; this call will 404 until added.
// ---------------------------------------------------------------------------

export async function updateIncidentCase(
  id: string,
  updates: { case_status?: Incident["case_status"]; assigned_officer?: string | null }
): Promise<Incident> {
  return request<Incident>(`${GATEWAY_URL}/api/v1/incident/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
}

export { GATEWAY_URL as API_BASE_URL };