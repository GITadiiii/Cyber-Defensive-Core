"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { fetchIncidents } from "@/lib/api";
import { onThreatBroadcast } from "@/lib/socket";
import type { Incident, ThreatBroadcastPayload } from "@/lib/types";

const DEFAULT_CENTER: [number, number] = [22.5, 79.0]; // India centroid — map framing only, not incident data
const DEFAULT_ZOOM = 5;

function severityColor(pstiComposite: number): string {
  if (pstiComposite > 81) return "#dc2626"; // CRITICAL
  if (pstiComposite > 60) return "#ea580c"; // HIGH
  if (pstiComposite > 35) return "#ca8a04"; // MEDIUM
  return "#16a34a"; // LOW
}

export default function IncidentMap() {
  const [incidents, setIncidents] = useState<Incident[] | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "unreachable">(
    "loading"
  );

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const res = await fetchIncidents({ limit: 200 });
      if (cancelled) return;
      if (!res) {
        setStatus("unreachable");
        setIncidents(null);
        return;
      }
      setIncidents(res.data);
      setStatus("ready");
    }

    load();
    const interval = setInterval(load, 15000); // poll fallback alongside socket updates

    const unsubscribe = onThreatBroadcast((payload: ThreatBroadcastPayload) => {
      setIncidents((prev) => {
        const incoming = payload as unknown as Incident;
        if (!prev) return [incoming];
        return [incoming, ...prev.filter((i) => i._id !== incoming._id)];
      });
      setStatus("ready");
    });

    return () => {
      cancelled = true;
      clearInterval(interval);
      unsubscribe();
    };
  }, []);

  if (status === "unreachable") {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 text-gray-500">
        <div className="text-center">
          <p className="font-medium">No data</p>
          <p className="text-sm">
            Could not reach the incidents API. Retrying every 15s.
          </p>
        </div>
      </div>
    );
  }

  return (
    <MapContainer
      center={DEFAULT_CENTER}
      zoom={DEFAULT_ZOOM}
      scrollWheelZoom
      className="h-full w-full rounded-lg"
    >
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {incidents?.map((incident) => (
        <CircleMarker
          key={incident._id}
          center={[incident.location.lat, incident.location.lng]}
          radius={8}
          pathOptions={{
            color: severityColor(incident.threat_scores.psti_composite),
            fillColor: severityColor(incident.threat_scores.psti_composite),
            fillOpacity: 0.7,
          }}
        >
          <Popup>
            <div className="text-sm">
              <p className="font-semibold">{incident.incidentType}</p>
              <p>Verdict: {incident.verdict_state}</p>
              <p>PSTI: {incident.threat_scores.psti_composite.toFixed(1)}</p>
              <p className="text-gray-500">
                {new Date(incident.timestamp).toLocaleString()}
              </p>
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
