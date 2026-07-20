"use client";

import { useState } from "react";
import { analyzeScamText, ApiUnreachableError } from "@/lib/api";
import type { ScamTextResult, SupportedLangCode } from "@/lib/types";
import { Loader2, ShieldAlert, ShieldCheck, RotateCcw } from "lucide-react";

const LANGUAGES: { code: SupportedLangCode; label: string }[] = [
  { code: "hin_Deva", label: "Hindi" },
  { code: "tam_Taml", label: "Tamil" },
  { code: "tel_Telu", label: "Telugu" },
  { code: "mar_Deva", label: "Marathi" },
  { code: "ben_Beng", label: "Bangla" },
];

function severityLabel(score: number) {
  if (score >= 70) return { label: "High risk", tone: "bad" as const };
  if (score >= 35) return { label: "Moderate risk", tone: "mid" as const };
  return { label: "Low risk", tone: "good" as const };
}

export default function ScamTextPage() {
  const [text, setText] = useState("");
  const [lang, setLang] = useState<SupportedLangCode>("hin_Deva");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [result, setResult] = useState<ScamTextResult | null>(null);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setStatus("loading");
    setError("");
    try {
      const res = await analyzeScamText(text, lang);
      setResult(res);
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setError(
        err instanceof ApiUnreachableError
          ? err.message
          : err instanceof Error
          ? err.message
          : "Analysis failed. Please try again."
      );
    }
  }

  function reset() {
    setStatus("idle");
    setResult(null);
    setError("");
    setText("");
  }

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-white">Scam Script Check</h1>
        <p className="mt-1 text-sm text-slate-500">
          Paste a suspicious call transcript or message to check for known scam patterns.
        </p>
      </header>

      <div className="max-w-xl">
        {status === "success" && result ? (
          <div
            className={`rounded-xl border p-6 ${
              severityLabel(result.psychological_script_score).tone === "bad"
                ? "border-red-500/30 bg-red-950/20"
                : severityLabel(result.psychological_script_score).tone === "mid"
                ? "border-yellow-500/30 bg-yellow-950/20"
                : "border-green-500/30 bg-green-950/20"
            }`}
          >
            <div className="flex items-center gap-3">
              {severityLabel(result.psychological_script_score).tone === "good" ? (
                <ShieldCheck className="text-green-400" size={26} />
              ) : (
                <ShieldAlert
                  className={
                    severityLabel(result.psychological_script_score).tone === "bad"
                      ? "text-red-400"
                      : "text-yellow-400"
                  }
                  size={26}
                />
              )}
              <div>
                <p className="font-semibold text-white">
                  {severityLabel(result.psychological_script_score).label} —{" "}
                  {result.psychological_script_score}/100
                </p>
                <p className="text-sm text-slate-400">
                  {result.detected_phrases.length > 0
                    ? `Matched patterns: ${result.detected_phrases.join(", ")}`
                    : "No known scam patterns matched"}
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-lg bg-black/20 p-4">
              <p className="mb-1 text-xs uppercase tracking-wide text-slate-500">
                Translated text
              </p>
              <p className="text-sm text-slate-300">{result.translated_text}</p>
            </div>

            <button
              onClick={reset}
              className="mt-5 flex items-center gap-1.5 rounded-md bg-white/10 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-white/20"
            >
              <RotateCcw size={14} /> Check another message
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">
                Language
              </label>
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value as SupportedLangCode)}
                className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 focus:border-[#4d8fdb] focus:outline-none"
              >
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code} className="bg-[#0B0F14]">
                    {l.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">
                Message or call transcript
              </label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={6}
                placeholder="Paste the suspicious text here…"
                className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:border-[#4d8fdb] focus:outline-none"
              />
              <p className="mt-1 text-xs text-slate-600">{text.length} characters</p>
            </div>

            {status === "error" && (
              <p className="text-sm text-red-400">{error}</p>
            )}

            <button
              type="submit"
              disabled={status === "loading" || !text.trim()}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-[#2c5aa0] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#2c5aa0]/90 disabled:opacity-50"
            >
              {status === "loading" && <Loader2 size={16} className="animate-spin" />}
              {status === "loading" ? "Analyzing…" : "Check message"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
