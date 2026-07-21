"use client";

import { useState } from "react";
import FileAnalyzer from "@/components/shared/FileAnalyzer";
import ConfidenceBar from "@/components/shared/ConfidenceBar";
import { analyzeDeepfake } from "@/lib/api";
import type { DeepfakeResult } from "@/lib/types";
import { ShieldAlert, ShieldCheck, AlertTriangle } from "lucide-react";

const MIN_WIDTH = 640;
const MIN_HEIGHT = 480;

// Reads a video file's actual pixel dimensions in the browser, without
// uploading it anywhere — used purely to warn the user before analysis.
function getVideoResolution(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    const url = URL.createObjectURL(file);
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve({ width: video.videoWidth, height: video.videoHeight });
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read video metadata"));
    };
    video.src = url;
  });
}

export default function DeepfakePage() {
  const [lowResolutionWarning, setLowResolutionWarning] = useState(false);

  async function handleAnalyze(file: File): Promise<DeepfakeResult> {
    try {
      const { width, height } = await getVideoResolution(file);
      setLowResolutionWarning(width < MIN_WIDTH || height < MIN_HEIGHT);
    } catch {
      // If resolution can't be read, don't block analysis — just skip the warning.
      setLowResolutionWarning(false);
    }
    return analyzeDeepfake(file);
  }

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-white">Deepfake Video Check</h1>
        <p className="mt-1 text-sm text-slate-500">
          Upload a video to check for signs of AI-generated manipulation.
        </p>
      </header>

      <div className="max-w-xl">
        {lowResolutionWarning && (
          <div className="mb-4 flex items-start gap-2 rounded-lg border border-yellow-500/30 bg-yellow-950/20 px-4 py-3 text-sm text-yellow-300">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            <p>
              This video is below {MIN_WIDTH}×{MIN_HEIGHT} resolution. Low-resolution footage
              can reduce detection accuracy — results should be treated as less reliable.
            </p>
          </div>
        )}

        <FileAnalyzer<DeepfakeResult>
          accept=".mp4,.mov,.avi,.webm,.mkv"
          maxSizeMB={300}
          helperText="MP4, MOV, AVI, WEBM, MKV — up to 300MB"
          analyzingLabel="Analyzing video frames for manipulation…"
          onAnalyze={handleAnalyze}
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
                onClick={() => {
                  setLowResolutionWarning(false);
                  reset();
                }}
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
