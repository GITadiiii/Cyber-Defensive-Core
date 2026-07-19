import type { Incident, IncidentsResponse } from "./types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

export class ApiUnreachableError extends Error {
  constructor(message = "Backend API is not reachable") {
    super(message);
    this.name = "ApiUnreachableError";
  }
}

/**
 * Fetches the paginated incidents list from Payal's gateway.
 * GET /api/v1/incidents
 *
 * Returns null (rather than throwing) when the API is unreachable so
 * callers can render a graceful "no data" state instead of crashing.
 */
export async function fetchIncidents(params?: {
  page?: number;
  limit?: number;
}): Promise<IncidentsResponse | null> {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));

  try {
    const res = await fetch(
      `${API_BASE_URL}/api/v1/incidents${query.toString() ? `?${query}` : ""}`,
      { cache: "no-store" }
    );

    if (!res.ok) {
      console.error(`GET /api/v1/incidents failed: ${res.status}`);
      return null;
    }

    return (await res.json()) as IncidentsResponse;
  } catch (err) {
    console.error("Failed to reach gateway for /api/v1/incidents:", err);
    return null;
  }
}

/**
 * Fetches a single incident by id.
 * GET /api/v1/incident/:id
 */
export async function fetchIncidentById(id: string): Promise<Incident | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/incident/${id}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as Incident;
  } catch (err) {
    console.error(`Failed to reach gateway for /api/v1/incident/${id}:`, err);
    return null;
  }
}

/**
 * Submits a citizen report/check.
 * POST /api/v1/incident
 *
 * Throws ApiUnreachableError on network failure or non-2xx so the
 * Citizen Sandbox form can show a clear error instead of a silent fail.
 */
export async function submitIncidentReport(payload: {
  session_uuid: string;
  citizen_phone_hash: string;
  incidentType: string;
  location: { lat: number; lng: number };
  [key: string]: unknown;
}): Promise<Incident> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}/api/v1/incident`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    throw new ApiUnreachableError();
  }

  if (res.status === 503) {
    throw new ApiUnreachableError(
      "A downstream analysis service is currently unavailable"
    );
  }
  if (!res.ok) {
    throw new Error(`Submission failed: ${res.status}`);
  }

  return (await res.json()) as Incident;
}

export { API_BASE_URL };
