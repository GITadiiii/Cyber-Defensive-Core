"use client";

import { useEffect, useState } from "react";
import { fetchIncidents } from "@/lib/api";
import { onThreatBroadcast } from "@/lib/socket";
import type { Incident, ThreatBroadcastPayload } from "@/lib/types";
import AlertBanner from "@/components/dashboard/AlertBanner";
import StatCards from "@/components/dashboard/StatCards";
import PstiGaugeCircle from "@/components/dashboard/PstiGaugeCircle";
import IncidentLookupTable from "@/components/dashboard/IncidentLookupTable";

export default function MapPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "unreachable">("loading");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const res = await fetchIncidents({ limit: 200 });
      if (cancelled) return;
      if (!res) {
        setStatus("unreachable");
        return;
      }
      setIncidents(res.data);
      setStatus("ready");
    }

    load();
    const interval = setInterval(load, 15000);

    const unsubscribe = onThreatBroadcast((payload: ThreatBroadcastPayload) => {
      setIncidents((prev) => {
        const incoming = payload as unknown as Incident;
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

  const totalCount = incidents.length;
  const criticalCount = incidents.filter((i) => i.verdict_state === "CRITICAL").length;
  const avgPsti =
    totalCount > 0
      ? incidents.reduce((sum, i) => sum + i.threat_scores.psti_composite, 0) / totalCount
      : 0;

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-white">Incident Map</h1>
        <p className="mt-1 text-sm text-slate-500">
          Live incident feed and threat intelligence overview.
        </p>
      </header>

      {status === "unreachable" ? (
        <div className="rounded-lg border border-dashed border-white/10 bg-white/2 p-8 text-center text-sm text-slate-500">
          Could not reach the incidents API.
        </div>
      ) : (
        <>
          <AlertBanner criticalCount={criticalCount} />
          <StatCards totalCount={totalCount} criticalCount={criticalCount} avgPsti={avgPsti} />

          <div className="mb-6">
            <PstiGaugeCircle value={avgPsti} />
          </div>

          <IncidentLookupTable incidents={incidents} />
        </>
      )}
    </div>
  );
}