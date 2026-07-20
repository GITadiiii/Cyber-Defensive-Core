"use client";

import { useCallback, useRef, useState, type ReactNode } from "react";
import { UploadCloud, FileWarning, RotateCcw } from "lucide-react";
import { ApiUnreachableError } from "@/lib/api";
import type { AnalyzerStatus } from "@/lib/types";

interface FileAnalyzerProps<T> {
  accept: string; // e.g. ".mp4,.mov,.avi,.webm,.mkv"
  maxSizeMB: number;
  helperText: string; // e.g. "MP4, MOV, AVI, WEBM, MKV up to 300MB"
  analyzingLabel?: string; // e.g. "Analyzing video for manipulation…"
  onAnalyze: (file: File) => Promise<T>;
  renderResult: (result: T, reset: () => void) => ReactNode;
}

export default function FileAnalyzer<T>({
  accept,
  maxSizeMB,
  helperText,
  analyzingLabel = "Analyzing…",
  onAnalyze,
  renderResult,
}: FileAnalyzerProps<T>) {
  const [status, setStatus] = useState<AnalyzerStatus>("idle");
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<T | null>(null);
  const [error, setError] = useState<string>("");
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const extensions = accept.split(",").map((e) => e.trim().toLowerCase());

  function validate(f: File): string | null {
    const ext = "." + (f.name.split(".").pop() || "").toLowerCase();
    if (!extensions.includes(ext)) {
      return `Unsupported file type "${ext}". Accepted: ${helperText}`;
    }
    if (f.size > maxSizeMB * 1024 * 1024) {
      return `File is too large (${(f.size / (1024 * 1024)).toFixed(1)}MB). Max allowed is ${maxSizeMB}MB.`;
    }
    return null;
  }

  async function handleFile(f: File) {
    const validationError = validate(f);
    if (validationError) {
      setError(validationError);
      setStatus("error");
      return;
    }
    setFile(f);
    setError("");
    setStatus("analyzing");
    try {
      const res = await onAnalyze(f);
      setResult(res);
      setStatus("success");
    } catch (err) {
      setStatus("error");
      if (err instanceof ApiUnreachableError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Analysis failed. Please try again.");
      }
    }
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function reset() {
    setStatus("idle");
    setFile(null);
    setResult(null);
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  }

  if (status === "success" && result) {
    return <>{renderResult(result, reset)}</>;
  }

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => status !== "analyzing" && inputRef.current?.click()}
        className={`flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-10 text-center transition-colors cursor-pointer ${
          dragging
            ? "border-[#4d8fdb] bg-[#2c5aa0]/10"
            : "border-white/15 hover:border-white/25 bg-white/2"
        } ${status === "analyzing" ? "pointer-events-none opacity-70" : ""}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />

        {status === "analyzing" ? (
          <>
            <div className="h-9 w-9 animate-spin rounded-full border-2 border-[#4d8fdb] border-t-transparent" />
            <p className="text-sm font-medium text-slate-200">{analyzingLabel}</p>
            <p className="text-xs text-slate-500">{file?.name}</p>
          </>
        ) : (
          <>
            <UploadCloud className="text-slate-400" size={30} />
            <p className="text-sm font-medium text-slate-200">
              Drag and drop a file, or click to browse
            </p>
            <p className="text-xs text-slate-500">{helperText}</p>
          </>
        )}
      </div>

      {status === "error" && (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-950/30 px-4 py-3 text-sm text-red-300">
          <FileWarning size={18} className="mt-0.5 shrink-0" />
          <div className="flex-1">
            <p>{error}</p>
            <button
              onClick={reset}
              className="mt-2 flex items-center gap-1.5 text-xs font-medium text-red-200 hover:text-white"
            >
              <RotateCcw size={13} /> Try again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}