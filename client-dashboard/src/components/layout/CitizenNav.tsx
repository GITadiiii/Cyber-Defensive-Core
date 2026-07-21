"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldCheck } from "lucide-react";

const NAV_ITEMS = [
  { href: "/citizen/deepfake", label: "Deepfake Check" },
  { href: "/citizen/voice", label: "Voice Check" },
  { href: "/citizen/currency", label: "Currency Check" },
  { href: "/citizen/scam-text", label: "Scam Text Check" },
  { href: "/citizen/website-checker", label: "Website Checker" },
];

export default function CitizenNav() {
  const pathname = usePathname();

  return (
    <header className="border-b border-white/10 bg-[#0B0F14]">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 sm:px-8">
        <Link href="/" className="flex items-center gap-2">
          <ShieldCheck size={20} className="text-[#4d8fdb]" />
          <span className="text-sm font-semibold text-white">DeepTrust Guardian</span>
          <span className="text-xs text-slate-500">· Citizen Sandbox</span>
        </Link>

        <nav className="flex flex-wrap gap-1">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-[#2c5aa0]/20 text-white"
                    : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}