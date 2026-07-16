# API Contract — Gateway Server

## REST Endpoints

### POST /api/v1/incident
**Request Body:**
```json
{
  "session_uuid": "string (required, unique)",
  "citizen_phone_hash": "string (required)",
  "incidentType": "deepfake | mule | voice | currency (required)",
  "location": { "lat": 0.0, "lng": 0.0 }
}
```
**Response (201):** Full Incident object with computed `threat_scores`, `verdict_state`.
**Error (503):** if AI or Graph service unreachable.
**Error (400):** if required fields missing.

### GET /api/v1/incident/:id
**Response (200):** Single Incident object. 404 if not found.

### GET /api/v1/incidents
**Query params:** `page`, `limit`
**Response (200):**
```json
{ "data": [...], "page": 1, "totalPages": 5, "totalIncidents": 42 }
```

## Socket.io Event

### threat-broadcast (emitted when psti_composite > 81)
```json
{
  "session_uuid": "string",
  "incidentType": "string",
  "psti_composite": 0,
  "verdict_state": "CRITICAL",
  "location": { "lat": 0.0, "lng": 0.0 },
  "timestamp": "ISODate"
}
```

## Notes for teammates
- **Aditi**: your AI service response should include fields like `confidence`/`confidenceScore` — gateway checks both.
- **Khushboo**: your graph service response should include `lviScore`.
- Base gateway URL: `http://localhost:5000` (update once deployed)