"use client";

import FileAnalyzer from "@/components/shared/FileAnalyzer";
import ConfidenceBar from "@/components/shared/ConfidenceBar";
import { analyzeCurrency } from "@/lib/api";
import type { CurrencyResult } from "@/lib/types";
import { ShieldAlert, ShieldCheck } from "lucide-react";

export default function CurrencyPage() {
  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-white">Currency Authenticity Check</h1>
        <p className="mt-1 text-sm text-slate-500">
          Upload a clear photo of a currency note to check for signs of counterfeiting.
        </p>
      </header>

      <div className="max-w-xl">
        <FileAnalyzer<CurrencyResult>
          accept=".jpg,.jpeg,.png,.bmp,.webp"
          maxSizeMB={20}
          helperText="JPG, PNG, BMP, WEBP — up to 20MB"
          analyzingLabel="Analyzing note for authenticity markers…"
          onAnalyze={analyzeCurrency}
          renderResult={(result, reset) => (
            <div
              className={`rounded-xl border p-6 ${
                result.isAuthentic
                  ? "border-green-500/30 bg-green-950/20"
                  : "border-red-500/30 bg-red-950/20"
              }`}
            >
              <div className="flex items-center gap-3">
                {result.isAuthentic ? (
                  <ShieldCheck className="text-green-400" size={26} />
                ) : (
                  <ShieldAlert className="text-red-400" size={26} />
                )}
                <div>
                  <p className="font-semibold text-white">
                    {result.isAuthentic
                      ? "Note appears authentic"
                      : "Note shows signs of counterfeiting"}
                  </p>
                  {result.flaggedRegions.length > 0 && (
                    <p className="text-sm text-slate-400">
                      {result.flaggedRegions.length} region(s) flagged for review
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-5">
                <ConfidenceBar
                  value={result.confidenceScore}
                  label="Authenticity confidence"
                  tone={result.isAuthentic ? "good" : "bad"}
                />
              </div>

              <button
                onClick={reset}
                className="mt-5 rounded-md bg-white/10 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-white/20"
              >
                Check another note
              </button>
            </div>
          )}
        />
      </div>
    </div>
  );
}
