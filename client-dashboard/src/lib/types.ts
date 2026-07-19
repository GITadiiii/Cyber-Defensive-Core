// Types mirror Payal's API_CONTRACT.md exactly — do not rename fields.
// incidentType / location were added on top of her original schema per the 16th-night sync.

export type VerdictState = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type IncidentType = "deepfake" | "mule" | "voice" | "currency";

export interface ThreatScores {
  deepfake_score: number;
  voice_spoof_score: number;
  psychological_script_score: number;
  network_velocity_score: number;
  psti_composite: number;
}

export interface Incident {
  _id: string;
  session_uuid: string;
  citizen_phone_hash: string;
  threat_scores: ThreatScores;
  verdict_state: VerdictState;
  incidentType: IncidentType;
  location: {
    lat: number;
    lng: number;
  };
  evidence_report_hash?: string;
  timestamp: string;
}

export interface IncidentsResponse {
  data: Incident[];
  page: number;
  totalPages: number;
  totalCount: number;
}

// Payload shape for the 'threat-broadcast' socket.io event, fired when
// psti_composite > 81 (per Payal's server.js POST /api/v1/incident handler).
export interface ThreatBroadcastPayload {
  _id: string;
  session_uuid: string;
  verdict_state: VerdictState;
  incidentType: IncidentType;
  threat_scores: ThreatScores;
  location: {
    lat: number;
    lng: number;
  };
  timestamp: string;
}
