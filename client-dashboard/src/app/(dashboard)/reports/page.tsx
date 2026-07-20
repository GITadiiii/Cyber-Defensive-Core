"use client";

import { useEffect, useState } from "react";
import { fetchIncidents } from "@/lib/api";
import type { Incident, VerdictState } from "@/lib/types";
import { Loader2 } from "lucide-react";

const VERDICTS: VerdictState[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

const VERDICT_STYLE: Record<VerdictState, string> = {
  LOW: "bg-green-500/15 text-green-400",
  MEDIUM: "bg-yellow-500/15 text-yellow-400",
  HIGH: "bg-orange-500/15 text-orange-400",
  CRITICAL: "bg-red-500/15 text-red-400",
};

export default function ReportsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "unreachable">("loading");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeFilters, setActiveFilters] = useState<VerdictState[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setStatus("loading");
      const res = await fetchIncidents({ page, limit: 15 });
      if (cancelled) return;
      if (!res) {
        setStatus("unreachable");
        return;
      }
      setIncidents(res.data);
      setTotalPages(res.totalPages || 1);
      setStatus("ready");
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [page]);

  function toggleFilter(v: VerdictState) {
    setActiveFilters((prev) =>
      prev.includes(v) ? prev.filter((f) => f !== v) : [...prev, v]
    );
  }

  const visible =
    activeFilters.length === 0
      ? incidents
      : incidents.filter((i) => activeFilters.includes(i.verdict_state));

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-white">Reports</h1>
        <p className="mt-1 text-sm text-slate-500">
          History of all submitted incident reports.
        </p>
      </header>

      <div className="mb-4 flex flex-wrap gap-2">
        {VERDICTS.map((v) => (
          <button
            key={v}
            onClick={() => toggleFilter(v)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              activeFilters.includes(v)
                ? VERDICT_STYLE[v]
                : "bg-white/5 text-slate-500 hover:bg-white/10"
            }`}
          >
            {v}
          </button>
        ))}
      </div>

      {status === "loading" && (
        <div className="flex items-center gap-2 py-10 text-sm text-slate-500">
          <Loader2 size={16} className="animate-spin" /> Loading reports…
        </div>
      )}

      {status === "unreachable" && (
        <div className="rounded-lg border border-dashed border-white/10 bg-white/2 p-8 text-center text-sm text-slate-500">
          Could not reach the incidents API.
        </div>
      )}

      {status === "ready" && (
        <>
          <div className="overflow-x-auto rounded-lg border border-white/10">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-white/3 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Verdict</th>
                  <th className="px-4 py-3">PSTI</th>
                  <th className="px-4 py-3">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {visible.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                      No reports match the current filters.
                    </td>
                  </tr>
                ) : (
                  visible.map((incident) => (
                    <tr key={incident._id} className="border-b border-white/5 last:border-0">
                      <td className="px-4 py-3 text-slate-300 capitalize">
                        {incident.incidentType}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                            VERDICT_STYLE[incident.verdict_state]
                          }`}
                        >
                          {incident.verdict_state}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-300">
                        {incident.threat_scores.psti_composite.toFixed(1)}
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {new Date(incident.timestamp).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
            <span>
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded-md bg-white/5 px-3 py-1.5 hover:bg-white/10 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="rounded-md bg-white/5 px-3 py-1.5 hover:bg-white/10 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
