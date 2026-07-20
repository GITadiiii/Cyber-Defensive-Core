"use client";

import { useEffect, useState } from "react";
import { fetchIncidents } from "@/lib/api";
import { onThreatBroadcast } from "@/lib/socket";
import type { Incident, ThreatBroadcastPayload } from "@/lib/types";
import AlertBanner from "@/components/dashboard/AlertBanner";
import StatCards from "@/components/dashboard/StatCards";
import PstiGaugeCircle from "@/components/dashboard/PstiGaugeCircle";
import IncidentLookupTable from "@/components/dashboard/IncidentLookupTable";

export default function DashboardOverview() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "unreachable">(
    "loading"
  );

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const res = await fetchIncidents({ limit: 500 });
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
      setIncidents((prev) => [payload as unknown as Incident, ...prev]);
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
      <div className="rounded-lg border border-dashed border-white/10 px-5 py-4 text-sm text-slate-500">
        No data — could not reach the incidents API.
      </div>
    );
  }

  if (status === "loading") {
    return (
      <div className="rounded-lg border border-white/10 bg-white/[0.02] px-5 py-4 text-sm text-slate-500">
        Loading dashboard overview…
      </div>
    );
  }

  const totalCount = incidents.length;
  const criticalCount = incidents.filter((i) => i.verdict_state === "CRITICAL").length;
  const avgPsti =
    totalCount > 0
      ? incidents.reduce((sum, i) => sum + i.threat_scores.psti_composite, 0) / totalCount
      : 0;

  return (
    <div>
      <AlertBanner criticalCount={criticalCount} />
      <StatCards totalCount={totalCount} criticalCount={criticalCount} avgPsti={avgPsti} />
      <div className="mb-8">
        <PstiGaugeCircle value={avgPsti} />
      </div>
      <IncidentLookupTable incidents={incidents} />
    </div>
  );
}
