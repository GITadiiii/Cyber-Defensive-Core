"use client";

import { useEffect, useState } from "react";
import { fetchIncidents, updateIncidentCase } from "@/lib/api";
import type { Incident } from "@/lib/types";
import { Loader2, User, AlertCircle } from "lucide-react";

type CaseStatus = NonNullable<Incident["case_status"]>;

const STATUS_STYLE: Record<CaseStatus, string> = {
  OPEN: "bg-blue-500/15 text-blue-400",
  IN_PROGRESS: "bg-yellow-500/15 text-yellow-400",
  RESOLVED: "bg-green-500/15 text-green-400",
  ESCALATED: "bg-red-500/15 text-red-400",
};

const STATUSES: CaseStatus[] = ["OPEN", "IN_PROGRESS", "RESOLVED", "ESCALATED"];

// Placeholder roster until a real officer-accounts system exists.
const OFFICERS = ["Unassigned", "Insp. Rao", "Insp. Verma", "SI Nair", "SI Kulkarni"];

// PSTI severity bands, matching the backend's LOW/MEDIUM/HIGH/CRITICAL cutoffs
// (0-35 / 36-60 / 61-80 / 81-100) so the color here means the same thing it
// means everywhere else in the system.
function pstiStyle(score: number): string {
  if (score >= 81) return "bg-red-500/15 text-red-400";
  if (score >= 61) return "bg-orange-500/15 text-orange-400";
  if (score >= 36) return "bg-yellow-500/15 text-yellow-400";
  return "bg-green-500/15 text-green-400";
}

export default function CasesPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "unreachable">("loading");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [errorId, setErrorId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const res = await fetchIncidents({ limit: 100 });
      if (cancelled) return;
      if (!res) {
        setStatus("unreachable");
        return;
      }
      setIncidents(res.data.map((i) => ({ case_status: "OPEN", ...i })));
      setStatus("ready");
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleStatusChange(id: string, newStatus: CaseStatus) {
    const previous = incidents;
    setSavingId(id);
    setErrorId(null);
    setIncidents((prev) =>
      prev.map((i) => (i._id === id ? { ...i, case_status: newStatus } : i))
    );
    try {
      await updateIncidentCase(id, { case_status: newStatus });
    } catch {
      // Backend call failed (network issue, not authenticated, etc.) —
      // revert the optimistic update so the UI doesn't lie about what's saved.
      setIncidents(previous);
      setErrorId(id);
    } finally {
      setSavingId(null);
    }
  }

  async function handleAssign(id: string, officer: string) {
    const value = officer === "Unassigned" ? null : officer;
    const previous = incidents;
    setSavingId(id);
    setErrorId(null);
    setIncidents((prev) =>
      prev.map((i) => (i._id === id ? { ...i, assigned_officer: value } : i))
    );
    try {
      await updateIncidentCase(id, { assigned_officer: value });
    } catch {
      setIncidents(previous);
      setErrorId(id);
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-white">Case Management</h1>
        <p className="mt-1 text-sm text-slate-500">
          Assign incidents to officers and track investigation status.
        </p>
      </header>

      {status === "loading" && (
        <div className="flex items-center gap-2 py-10 text-sm text-slate-500">
          <Loader2 size={16} className="animate-spin" /> Loading cases…
        </div>
      )}

      {status === "unreachable" && (
        <div className="rounded-lg border border-dashed border-white/10 bg-white/2 p-8 text-center text-sm text-slate-500">
          Could not reach the incidents API.
        </div>
      )}

      {status === "ready" && (
        <div className="space-y-3">
          {incidents.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-500">No cases yet.</p>
          ) : (
            incidents.map((incident) => (
              <div key={incident._id} className="flex flex-col gap-2">
                <div className="flex flex-col gap-3 rounded-lg border border-white/10 bg-white/2 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-medium capitalize text-white">
                      {incident.incidentType} case
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <span
                        className={`rounded px-1.5 py-0.5 text-xs font-semibold ${pstiStyle(
                          incident.threat_scores.psti_composite
                        )}`}
                      >
                        PSTI {incident.threat_scores.psti_composite.toFixed(1)}
                      </span>
                      <span className="text-xs text-slate-500">
                        {new Date(incident.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        STATUS_STYLE[incident.case_status || "OPEN"]
                      }`}
                    >
                      {(incident.case_status || "OPEN").replace("_", " ")}
                    </span>

                    <select
                      value={incident.case_status || "OPEN"}
                      onChange={(e) =>
                        handleStatusChange(incident._id, e.target.value as CaseStatus)
                      }
                      disabled={savingId === incident._id}
                      className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs text-slate-200 focus:border-[#4d8fdb] focus:outline-none disabled:opacity-50"
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s} className="bg-[#0B0F14]">
                          {s.replace("_", " ")}
                        </option>
                      ))}
                    </select>

                    <div className="flex items-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-2 py-1">
                      <User size={13} className="text-slate-500" />
                      <select
                        value={incident.assigned_officer || "Unassigned"}
                        onChange={(e) => handleAssign(incident._id, e.target.value)}
                        disabled={savingId === incident._id}
                        className="bg-transparent text-xs text-slate-200 focus:outline-none disabled:opacity-50"
                      >
                        {OFFICERS.map((o) => (
                          <option key={o} value={o} className="bg-[#0B0F14]">
                            {o}
                          </option>
                        ))}
                      </select>
                    </div>

                    {savingId === incident._id && (
                      <Loader2 size={14} className="animate-spin text-slate-500" />
                    )}
                  </div>
                </div>

                {errorId === incident._id && (
                  <div className="flex items-center gap-1.5 rounded-md bg-red-500/10 px-3 py-1.5 text-xs text-red-400">
                    <AlertCircle size={13} />
                    Couldn&apos;t save this change — reverted. Check the gateway is
                    reachable and you&apos;re still logged in.
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}