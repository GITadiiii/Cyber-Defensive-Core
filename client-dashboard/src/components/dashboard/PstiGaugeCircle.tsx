function tierLabel(value: number): { label: string; color: string } {
  if (value > 81) return { label: "CRITICAL", color: "#dc2626" };
  if (value > 60) return { label: "HIGH", color: "#ea580c" };
  if (value > 35) return { label: "MEDIUM", color: "#ca8a04" };
  return { label: "LOW", color: "#16a34a" };
}

export default function PstiGaugeCircle({ value }: { value: number }) {
  const pct = Math.min(Math.max(value, 0), 100);
  const tier = tierLabel(pct);

  return (
    <div className="flex items-center gap-5 rounded-lg border border-white/10 bg-white/2 px-5 py-4">
      <div
        className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-full"
        style={{
          background: `conic-gradient(${tier.color} ${pct * 3.6}deg, rgba(255,255,255,0.08) 0deg)`,
        }}
      >
        <div className="flex h-15.5 w-15.5 flex-col items-center justify-center rounded-full bg-[#0B0F14]">
          <span className="text-lg font-bold text-white">{Math.round(pct)}</span>
          <span className="text-[9px] uppercase tracking-wide text-slate-500">PSTI</span>
        </div>
      </div>
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-500">Avg System PSTI</p>
        <p className="text-2xl font-semibold text-white">{pct.toFixed(1)}</p>
        <span
          className="mt-1 inline-block rounded px-2 py-0.5 text-xs font-medium"
          style={{ backgroundColor: `${tier.color}22`, color: tier.color }}
        >
          {tier.label}
        </span>
      </div>
    </div>
  );
}