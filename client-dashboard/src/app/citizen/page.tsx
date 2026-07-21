"use client";

import { useState } from "react";
import { submitIncidentReport, ApiUnreachableError } from "@/lib/api";
import type { IncidentType } from "@/lib/types";
import { Loader2 } from "lucide-react";

const INCIDENT_TYPES: IncidentType[] = ["deepfake", "mule", "voice", "currency"];

export default function CitizenSandboxPage() {
  const [incidentType, setIncidentType] = useState<IncidentType>("deepfake");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    setErrorMsg("");

    try {
      // TODO: hash phone number before send (privacy) — pending agreement on hashing util
      await submitIncidentReport({
        session_uuid: crypto.randomUUID(),
        citizen_phone_hash: phone,
        incidentType,
        location: { lat: 0, lng: 0 }, // TODO: wire real geolocation
      });
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setErrorMsg(
        err instanceof ApiUnreachableError
          ? err.message
          : "Something went wrong submitting your report."
      );
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold text-white">Report or Check a Concern</h1>
        <p className="mt-1 text-sm text-slate-500">
          Report a suspicious call, video, message, or transaction.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-300">
            Type of concern
          </label>
          <select
            value={incidentType}
            onChange={(e) => setIncidentType(e.target.value as IncidentType)}
            className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 focus:border-[#4d8fdb] focus:outline-none"
          >
            {INCIDENT_TYPES.map((t) => (
              <option key={t} value={t} className="bg-[#0B0F14]">
                {t}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-300">
            Your phone number
          </label>
          <input
            type="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+91XXXXXXXXXX"
            className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:border-[#4d8fdb] focus:outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={status === "submitting"}
          className="flex w-full items-center justify-center gap-2 rounded-md bg-[#2c5aa0] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#2c5aa0]/90 disabled:opacity-50"
        >
          {status === "submitting" && <Loader2 size={16} className="animate-spin" />}
          {status === "submitting" ? "Submitting…" : "Submit report"}
        </button>

        {status === "success" && (
          <p className="text-sm text-green-400">Report submitted. Thank you.</p>
        )}
        {status === "error" && <p className="text-sm text-red-400">{errorMsg}</p>}
      </form>
    </div>
  );
}
