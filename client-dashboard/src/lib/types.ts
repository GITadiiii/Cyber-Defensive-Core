// Types mirror Payal's API_CONTRACT.md exactly — do not rename fields.
// incidentType / location were added on top of her original schema per the 16th-night sync.
//
// EXTENDED for the redesign: added result types for each analyzer tool
// (deepfake, currency, voice, scam-text, mule-trace), matching the exact
// response shapes returned by Aditi's and Khushboo's services.

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
  // Case management fields — NOT YET in Payal's MongoDB schema.
  // Add to Incident.js: case_status (default "OPEN"), assigned_officer (default null).
  case_status?: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "ESCALATED";
  assigned_officer?: string | null;
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

// ---------------------------------------------------------------------------
// Analyzer tool result types (Aditi's AI Compute Core, port 8000 + 8001)
// ---------------------------------------------------------------------------

export interface DeepfakeResult {
  isDeepfake: boolean;
  confidence: number; // 0-1
  framesAnalyzed: number;
  processingTimeMs: number;
}

export interface CurrencyResult {
  isAuthentic: boolean;
  confidenceScore: number; // 0-1
  flaggedRegions: { x: number; y: number; width: number; height: number }[];
}

export interface VoiceResult {
  isSpoofed: boolean;
  spoofConfidence: number; // 0-1
  confidence: number;
  durationSeconds: number;
  processingTimeMs: number;
}

export type SupportedLangCode =
  | "hin_Deva"
  | "tam_Taml"
  | "tel_Telu"
  | "mar_Deva"
  | "ben_Beng";

export interface ScamTextResult {
  session_uuid: string;
  psychological_script_score: number; // 0-100
  detected_phrases: string[];
  translated_text: string;
}

export interface MuleChain {
  origin_account: string;
  destination_account: string;
  chain_accounts: string[];
  hop_count: number;
  laundering_hop_count: number;
  total_amount_inr: number;
  network_velocity_score: number;
}

export interface MuleTraceResult {
  chains: MuleChain[];
  count: number;
}

// Generic wrapper every analyzer hook/component uses so loading/error/result
// states are handled the same way everywhere.
export type AnalyzerStatus = "idle" | "uploading" | "analyzing" | "success" | "error";