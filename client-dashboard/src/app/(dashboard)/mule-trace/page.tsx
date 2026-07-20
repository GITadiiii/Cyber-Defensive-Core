"use client";

import { useState } from "react";
import { traceMuleChains, ApiUnreachableError } from "@/lib/api";
import type { MuleTraceResult } from "@/lib/types";
import { Loader2, Search, ArrowRight, RotateCcw } from "lucide-react";

export default function MuleTracePage() {
  const [account, setAccount] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [result, setResult] = useState<MuleTraceResult | null>(null);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setError("");
    try {
      const res = await traceMuleChains(
        account.trim() ? { account_number: account.trim() } : {}
      );
      setResult(res);
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setError(
        err instanceof ApiUnreachableError
          ? err.message
          : err instanceof Error
          ? err.message
          : "Trace failed. Please try again."
      );
    }
  }

  function reset() {
    setStatus("idle");
    setResult(null);
    setError("");
    setAccount("");
  }

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-white">Mule Chain Trace</h1>
        <p className="mt-1 text-sm text-slate-500">
          Enter an account number to trace multi-hop money laundering chains, or leave
          blank to scan all flagged accounts.
        </p>
      </header>

      <div className="max-w-2xl">
        <form onSubmit={handleSubmit} className="mb-6 flex gap-2">
          <input
            value={account}
            onChange={(e) => setAccount(e.target.value)}
            placeholder="Account number (optional)"
            className="flex-1 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:border-[#4d8fdb] focus:outline-none"
          />
          <button
            type="submit"
            disabled={status === "loading"}
            className="flex items-center gap-2 rounded-md bg-[#2c5aa0] px-4 py-2 text-sm font-medium text-white hover:bg-[#2c5aa0]/90 disabled:opacity-50"
          >
            {status === "loading" ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Search size={16} />
            )}
            Trace
          </button>
        </form>

        {status === "error" && (
          <p className="mb-4 text-sm text-red-400">{error}</p>
        )}

        {status === "success" && result && (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-slate-400">
                {result.count} chain{result.count !== 1 ? "s" : ""} found
              </p>
              <button
                onClick={reset}
                className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200"
              >
                <RotateCcw size={13} /> New search
              </button>
            </div>

            {result.chains.length === 0 ? (
              <div className="rounded-lg border border-dashed border-white/10 bg-white/2 p-8 text-center text-sm text-slate-500">
                No laundering chains found for this query.
              </div>
            ) : (
              <div className="space-y-3">
                {result.chains.map((chain, i) => (
                  <div
                    key={i}
                    className="rounded-lg border border-white/10 bg-white/2 p-4"
                  >
                    <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
                      {chain.chain_accounts.map((acc, idx) => (
                        <span key={idx} className="flex items-center gap-2">
                          <span className="rounded bg-white/10 px-2 py-1 font-mono text-xs text-slate-200">
                            {acc}
                          </span>
                          {idx < chain.chain_accounts.length - 1 && (
                            <ArrowRight size={13} className="text-slate-600" />
                          )}
                        </span>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-slate-500">
                      <span>{chain.hop_count} hops</span>
                      <span>{chain.laundering_hop_count} flagged laundering</span>
                      <span>₹{chain.total_amount_inr.toLocaleString("en-IN")} moved</span>
                      <span>Velocity score: {chain.network_velocity_score}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
