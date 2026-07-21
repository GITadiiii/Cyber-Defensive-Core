import type { Incident } from "@/lib/types";

const DOT_COLOR: Record<Incident["verdict_state"], string> = {
  LOW: "#16a34a",
  MEDIUM: "#ca8a04",
  HIGH: "#ea580c",
  CRITICAL: "#dc2626",
};

export default function IncidentLookupTable({ incidents }: { incidents: Incident[] }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/2">
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
        <span className="h-2 w-2 rounded-full bg-[#4d8fdb]" />
        <p className="text-sm font-medium text-white">Incident Lookup Table</p>
      </div>

      <div className="max-h-80 overflow-y-auto">
        {incidents.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-slate-500">No incidents yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-[#0B0F14]">
              <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-2">Type</th>
                <th className="px-4 py-2 text-right">PSTI Score</th>
              </tr>
            </thead>
            <tbody>
              {incidents.map((incident) => (
                <tr key={incident._id} className="border-t border-white/5">
                  <td className="px-4 py-2.5 capitalize text-slate-300">
                    {incident.incidentType}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <span className="inline-flex items-center gap-1.5 font-mono text-slate-200">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: DOT_COLOR[incident.verdict_state] }}
                      />
                      {incident.threat_scores.psti_composite.toFixed(1)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}