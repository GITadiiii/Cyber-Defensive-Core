"use client";

import { useState } from "react";
import { submitIncidentReport, ApiUnreachableError } from "@/lib/api";
import type { IncidentType } from "@/lib/types";

const INCIDENT_TYPES: IncidentType[] = ["deepfake", "mule", "voice", "currency"];

export default function CitizenSandboxPage() {
  const [incidentType, setIncidentType] = useState<IncidentType>("deepfake");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    setErrorMsg("");

    try {
      // citizen_phone_hash should be hashed client-side or server-side before
      // storage per Payal's schema — using a placeholder hash call here.
      await submitIncidentReport({
        session_uuid: crypto.randomUUID(),
        citizen_phone_hash: phone, // TODO: hash before send once hashing util is agreed with Payal
        incidentType,
        location: { lat: 0, lng: 0 }, // TODO: wire real geolocation
      });
      setStatus("success");
    } catch (err) {
      setStatus("error");
      if (err instanceof ApiUnreachableError) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg("Something went wrong submitting your report.");
      }
    }
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-12">
      <h1 className="text-2xl font-semibold text-gray-900">
        Citizen Sandbox
      </h1>
      <p className="mt-1 text-sm text-gray-500">
        Report or check a suspicious call, video, or transaction.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Type of concern
          </label>
          <select
            value={incidentType}
            onChange={(e) => setIncidentType(e.target.value as IncidentType)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            {INCIDENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Your phone number
          </label>
          <input
            type="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            placeholder="+91XXXXXXXXXX"
          />
        </div>

        <button
          type="submit"
          disabled={status === "submitting"}
          className="w-full rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
        >
          {status === "submitting" ? "Submitting…" : "Submit report"}
        </button>

        {status === "success" && (
          <p className="text-sm text-green-600">
            Report submitted. Thank you.
          </p>
        )}
        {status === "error" && (
          <p className="text-sm text-red-600">{errorMsg}</p>
        )}
      </form>
    </main>
  );
}
