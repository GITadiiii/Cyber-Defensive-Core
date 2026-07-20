import { AlertTriangle } from "lucide-react";
import type { VerdictState } from "@/lib/types";

function overallTier(avgPsti: number): { label: VerdictState | "IDLE"; color: string } {
  if (avgPsti === 0) return { label: "IDLE", color: "text-slate-400" };
  if (avgPsti > 81) return { label: "CRITICAL", color: "text-red-400" };
  if (avgPsti > 60) return { label: "HIGH", color: "text-orange-400" };
  if (avgPsti > 35) return { label: "MEDIUM", color: "text-yellow-400" };
  return { label: "LOW", color: "text-green-400" };
}

export default function StatCards({
  totalCount,
  criticalCount,
  avgPsti,
}: {
  totalCount: number;
  criticalCount: number;
  avgPsti: number;
}) {
  const tier = overallTier(avgPsti);
  return (
    <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
      <div className="rounded-lg border border-white/10 bg-white/2 px-5 py-4">
        <p className="text-xs uppercase tracking-wide text-slate-500">Active Incidents</p>
        <p className="mt-1 text-2xl font-semibold text-white">{totalCount}</p>
      </div>
      <div className="rounded-lg border border-white/10 bg-white/2 px-5 py-4">
        <p className="text-xs uppercase tracking-wide text-slate-500">Critical Verdicts</p>
        <p className="mt-1 text-2xl font-semibold text-red-400">{criticalCount}</p>
      </div>
      <div className="rounded-lg border border-white/10 bg-white/2 px-5 py-4">
        <p className="text-xs uppercase tracking-wide text-slate-500">System Threat Tier</p>
        <p className={`mt-1 flex items-center gap-1.5 text-2xl font-semibold ${tier.color}`}>
          <AlertTriangle size={20} />
          {tier.label}
        </p>
      </div>
    </div>
  );
}
