"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchIncidents } from "@/lib/api";
import type { Incident, IncidentType, VerdictState } from "@/lib/types";
import { Loader2 } from "lucide-react";

const TYPE_LABELS: Record<IncidentType, string> = {
  deepfake: "Deepfake",
  mule: "Mule / Laundering",
  voice: "Voice Spoof",
  currency: "Fake Currency",
};

const VERDICT_COLOR: Record<VerdictState, string> = {
  LOW: "#16a34a",
  MEDIUM: "#ca8a04",
  HIGH: "#ea580c",
  CRITICAL: "#dc2626",
};

function BarRow({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="text-slate-400">{label}</span>
        <span className="font-mono text-slate-300">{count}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "unreachable">("loading");

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
    return () => {
      cancelled = true;
    };
  }, []);

  const byType = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const i of incidents) counts[i.incidentType] = (counts[i.incidentType] || 0) + 1;
    return counts;
  }, [incidents]);

  const byVerdict = useMemo(() => {
    const counts: Record<VerdictState, number> = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };
    for (const i of incidents) counts[i.verdict_state] += 1;
    return counts;
  }, [incidents]);

  const last7Days = useMemo(() => {
    const days: { label: string; count: number }[] = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const day = new Date(now);
      day.setDate(now.getDate() - i);
      const dayKey = day.toDateString();
      const count = incidents.filter(
        (inc) => new Date(inc.timestamp).toDateString() === dayKey
      ).length;
      days.push({ label: day.toLocaleDateString("en-IN", { weekday: "short" }), count });
    }
    return days;
  }, [incidents]);

  const maxDayCount = Math.max(...last7Days.map((d) => d.count), 1);
  const total = incidents.length;

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-white">Analytics & Trends</h1>
        <p className="mt-1 text-sm text-slate-500">
          Patterns across all reported incidents.
        </p>
      </header>

      {status === "loading" && (
        <div className="flex items-center gap-2 py-10 text-sm text-slate-500">
          <Loader2 size={16} className="animate-spin" /> Loading analytics…
        </div>
      )}

      {status === "unreachable" && (
        <div className="rounded-lg border border-dashed border-white/10 bg-white/2 p-8 text-center text-sm text-slate-500">
          Could not reach the incidents API.
        </div>
      )}

      {status === "ready" && (
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="rounded-lg border border-white/10 bg-white/2 p-5">
            <p className="mb-4 text-sm font-medium text-white">Incidents by Type</p>
            <div className="space-y-3">
              {(Object.keys(TYPE_LABELS) as IncidentType[]).map((t) => (
                <BarRow
                  key={t}
                  label={TYPE_LABELS[t]}
                  count={byType[t] || 0}
                  total={total}
                  color="#4d8fdb"
                />
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/2 p-5">
            <p className="mb-4 text-sm font-medium text-white">Incidents by Severity</p>
            <div className="space-y-3">
              {(Object.keys(byVerdict) as VerdictState[]).map((v) => (
                <BarRow
                  key={v}
                  label={v}
                  count={byVerdict[v]}
                  total={total}
                  color={VERDICT_COLOR[v]}
                />
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/2 p-5 lg:col-span-2">
            <p className="mb-4 text-sm font-medium text-white">Last 7 Days — Report Volume</p>
            <div className="flex h-40 items-end justify-between gap-2">
              {last7Days.map((d, idx) => (
                <div key={idx} className="flex flex-1 flex-col items-center gap-2">
                  <div
                    className="w-full rounded-t bg-[#4d8fdb] transition-all duration-500"
                    style={{ height: `${(d.count / maxDayCount) * 100}%`, minHeight: d.count > 0 ? "6px" : "2px" }}
                  />
                  <span className="text-xs text-slate-500">{d.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}