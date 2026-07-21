import { AlertOctagon } from "lucide-react";

export default function AlertBanner({
  criticalCount,
}: {
  criticalCount: number;
}) {
  if (criticalCount === 0) return null;

  return (
    <div className="mb-6 flex items-center gap-3 rounded-lg border border-red-500/30 bg-red-950/40 px-5 py-3">
      <AlertOctagon size={18} className="shrink-0 text-red-400" />
      <p className="text-sm font-medium text-red-300">
        {criticalCount} CRITICAL alert{criticalCount !== 1 ? "s" : ""} detected — review the
        incident table below for details.
      </p>
    </div>
  );
}