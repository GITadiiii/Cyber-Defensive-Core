"use client";

import { useEffect, useState } from "react";
import { fetchIncidents, updateIncidentCase } from "@/lib/api";
import type { Incident } from "@/lib/types";
import { Loader2, User } from "lucide-react";

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

export default function CasesPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "unreachable">("loading");
  const [savingId, setSavingId] = useState<string | null>(null);

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
    setSavingId(id);
    setIncidents((prev) =>
      prev.map((i) => (i._id === id ? { ...i, case_status: newStatus } : i))
    );
    try {
      await updateIncidentCase(id, { case_status: newStatus });
    } catch {
      // Backend endpoint isn't live yet — keep the optimistic UI update,
      // but this won't persist across a refresh until Payal adds the route.
    } finally {
      setSavingId(null);
    }
  }

  async function handleAssign(id: string, officer: string) {
    const value = officer === "Unassigned" ? null : officer;
    setSavingId(id);
    setIncidents((prev) =>
      prev.map((i) => (i._id === id ? { ...i, assigned_officer: value } : i))
    );
    try {
      await updateIncidentCase(id, { assigned_officer: value });
    } catch {
      // same note as above
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
              <div
                key={incident._id}
                className="flex flex-col gap-3 rounded-lg border border-white/10 bg-white/2 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-medium capitalize text-white">
                    {incident.incidentType} case
                  </p>
                  <p className="text-xs text-slate-500">
                    PSTI {incident.threat_scores.psti_composite.toFixed(1)} ·{" "}
                    {new Date(incident.timestamp).toLocaleDateString()}
                  </p>
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
                    className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs text-slate-200 focus:border-[#4d8fdb] focus:outline-none"
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
                      className="bg-transparent text-xs text-slate-200 focus:outline-none"
                    >
                      {OFFICERS.map((o) => (
                        <option key={o} value={o} className="bg-[#0B0F14]">
                          {o}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <p className="mt-6 text-xs text-slate-600">
        Note: status/assignment changes need a{" "}
        <code className="rounded bg-black/30 px-1 py-0.5">PATCH /api/v1/incident/:id</code>{" "}
        route on the gateway to persist — not added yet, so changes reset on refresh for now.
      </p>
    </div>
  );
}