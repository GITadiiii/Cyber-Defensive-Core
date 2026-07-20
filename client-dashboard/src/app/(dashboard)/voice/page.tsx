"use client";

import FileAnalyzer from "@/components/shared/FileAnalyzer";
import ConfidenceBar from "@/components/shared/ConfidenceBar";
import { analyzeVoice } from "@/lib/api";
import type { VoiceResult } from "@/lib/types";
import { ShieldAlert, ShieldCheck } from "lucide-react";

export default function VoicePage() {
  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-white">Voice Spoof Check</h1>
        <p className="mt-1 text-sm text-slate-500">
          Upload a call recording or voice clip to check for AI voice cloning.
        </p>
      </header>

      <div className="max-w-xl">
        <FileAnalyzer<VoiceResult>
          accept=".wav,.mp3,.flac,.ogg,.m4a,.mp4"
          maxSizeMB={30}
          helperText="WAV, MP3, FLAC, OGG, M4A — up to 30MB"
          analyzingLabel="Analyzing voice for spoofing…"
          onAnalyze={analyzeVoice}
          renderResult={(result, reset) => (
            <div
              className={`rounded-xl border p-6 ${
                result.isSpoofed
                  ? "border-red-500/30 bg-red-950/20"
                  : "border-green-500/30 bg-green-950/20"
              }`}
            >
              <div className="flex items-center gap-3">
                {result.isSpoofed ? (
                  <ShieldAlert className="text-red-400" size={26} />
                ) : (
                  <ShieldCheck className="text-green-400" size={26} />
                )}
                <div>
                  <p className="font-semibold text-white">
                    {result.isSpoofed
                      ? "Voice appears to be synthetic or spoofed"
                      : "Voice appears genuine"}
                  </p>
                  <p className="text-sm text-slate-400">
                    {result.durationSeconds}s clip · analyzed in {result.processingTimeMs}ms
                  </p>
                </div>
              </div>

              <div className="mt-5">
                <ConfidenceBar
                  value={result.spoofConfidence}
                  label="Spoof confidence"
                  tone={result.isSpoofed ? "bad" : "good"}
                />
              </div>

              <button
                onClick={reset}
                className="mt-5 rounded-md bg-white/10 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-white/20"
              >
                Check another clip
              </button>
            </div>
          )}
        />
      </div>
    </div>
  );
}
