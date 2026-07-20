"use client";

import FileAnalyzer from "@/components/shared/FileAnalyzer";
import ConfidenceBar from "@/components/shared/ConfidenceBar";
import { analyzeDeepfake } from "@/lib/api";
import type { DeepfakeResult } from "@/lib/types";
import { ShieldAlert, ShieldCheck } from "lucide-react";

export default function DeepfakePage() {
  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-white">Deepfake Video Check</h1>
        <p className="mt-1 text-sm text-slate-500">
          Upload a video to check for signs of AI-generated manipulation.
        </p>
      </header>

      <div className="max-w-xl">
        <FileAnalyzer<DeepfakeResult>
          accept=".mp4,.mov,.avi,.webm,.mkv"
          maxSizeMB={300}
          helperText="MP4, MOV, AVI, WEBM, MKV — up to 300MB"
          analyzingLabel="Analyzing video frames for manipulation…"
          onAnalyze={analyzeDeepfake}
          renderResult={(result, reset) => (
            <div
              className={`rounded-xl border p-6 ${
                result.isDeepfake
                  ? "border-red-500/30 bg-red-950/20"
                  : "border-green-500/30 bg-green-950/20"
              }`}
            >
              <div className="flex items-center gap-3">
                {result.isDeepfake ? (
                  <ShieldAlert className="text-red-400" size={26} />
                ) : (
                  <ShieldCheck className="text-green-400" size={26} />
                )}
                <div>
                  <p className="font-semibold text-white">
                    {result.isDeepfake
                      ? "Signs of manipulation detected"
                      : "No signs of manipulation detected"}
                  </p>
                  <p className="text-sm text-slate-400">
                    {result.framesAnalyzed} frames analyzed in {result.processingTimeMs}ms
                  </p>
                </div>
              </div>

              <div className="mt-5">
                <ConfidenceBar
                  value={result.confidence}
                  label="Deepfake confidence"
                  tone={result.isDeepfake ? "bad" : "good"}
                />
              </div>

              <button
                onClick={reset}
                className="mt-5 rounded-md bg-white/10 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-white/20"
              >
                Check another video
              </button>
            </div>
          )}
        />
      </div>
    </div>
  );
}
