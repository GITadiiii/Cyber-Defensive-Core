"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { GATEWAY_URL } from "@/lib/config";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`${GATEWAY_URL}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // sends/receives the httpOnly cookie
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        router.push("/map");
      } else {
        let message = "Invalid email or password.";
        try {
          const body = await res.json();
          message = body?.error || message;
        } catch {
          // response wasn't JSON, keep default message
        }
        setError(message);
      }
    } catch {
      setError("Could not reach the gateway. Check that it's running.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B0F14] px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 justify-center mb-8">
          <ShieldCheck size={26} className="text-[#4d8fdb]" />
          <div className="text-center">
            <p className="text-base font-semibold text-white leading-tight">
              DeepTrust Guardian
            </p>
            <p className="text-xs text-slate-500 leading-tight">Cyber-Cell Console</p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white/5 border border-white/10 rounded-xl p-6 flex flex-col gap-4"
        >
          <h1 className="text-sm font-medium text-slate-300 mb-1">
            Officer Sign In
          </h1>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-xs text-slate-400">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-lg bg-[#0B0F14] border border-white/10 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-[#4d8fdb] transition-colors"
              placeholder="officer@cybercell.gov.in"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-xs text-slate-400">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-lg bg-[#0B0F14] border border-white/10 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-[#4d8fdb] transition-colors"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 rounded-lg bg-[#2c5aa0] hover:bg-[#2c5aa0]/80 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium py-2.5 transition-colors"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="text-xs text-slate-600 text-center mt-6">
          Officer accounts are provisioned by admin only. Contact your
          department if you need access.
        </p>
      </div>
    </div>
  );
}