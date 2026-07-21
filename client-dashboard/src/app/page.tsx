import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[#0B0F14] px-4 text-center">
      <ShieldCheck size={40} className="text-[#4d8fdb]" />
      <div>
        <h1 className="text-3xl font-semibold text-white">
          Digital Public Safety Intelligence Platform
        </h1>
        <p className="mt-2 text-slate-500">
          DeepTrust Guardian &amp; MuleHunter Core
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-4">
        <Link
          href="/citizen"
          className="rounded-md border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-medium text-slate-200 hover:bg-white/10"
        >
          Citizen Sandbox
        </Link>
        <Link
          href="/map"
          className="rounded-md bg-[#2c5aa0] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#2c5aa0]/90"
        >
          Cyber-Cell Console
        </Link>
      </div>
    </main>
  );
}