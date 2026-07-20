"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Map,
  Video,
  Mic,
  Banknote,
  MessageSquareWarning,
  Share2,
  ShieldAlert,
  ClipboardList,
  Menu,
  X,
  ShieldCheck,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/map", label: "Incident Map", icon: Map },
  { href: "/deepfake", label: "Deepfake Check", icon: Video },
  { href: "/voice", label: "Voice Spoof Check", icon: Mic },
  { href: "/currency", label: "Currency Check", icon: Banknote },
  { href: "/scam-text", label: "Scam Text Check", icon: MessageSquareWarning },
  { href: "/mule-trace", label: "Mule Chain Trace", icon: Share2 },
  { href: "/website-checker", label: "Website Checker", icon: ShieldAlert },
  { href: "/reports", label: "Reports", icon: ClipboardList },
];

function NavLinks({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-1 px-3">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              active
                ? "bg-[#2c5aa0]/20 text-white border-l-2 border-[#4d8fdb]"
                : "text-slate-400 hover:bg-white/5 hover:text-slate-200 border-l-2 border-transparent"
            }`}
          >
            <Icon size={18} strokeWidth={2} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 border-r border-white/10 bg-[#0B0F14]">
        <div className="flex items-center gap-2 px-5 py-5 border-b border-white/10">
          <ShieldCheck size={22} className="text-[#4d8fdb]" />
          <div>
            <p className="text-sm font-semibold text-white leading-tight">
              DeepTrust Guardian
            </p>
            <p className="text-xs text-slate-500 leading-tight">Cyber-Cell Console</p>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto py-4">
          <NavLinks pathname={pathname} />
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 inset-x-0 z-40 flex items-center justify-between px-4 py-3 bg-[#0B0F14] border-b border-white/10">
        <div className="flex items-center gap-2">
          <ShieldCheck size={20} className="text-[#4d8fdb]" />
          <span className="text-sm font-semibold text-white">DeepTrust Guardian</span>
        </div>
        <button
          aria-label="Toggle navigation menu"
          onClick={() => setMobileOpen(true)}
          className="p-2 text-slate-300 hover:text-white"
        >
          <Menu size={22} />
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <div className="relative w-72 bg-[#0B0F14] border-r border-white/10 flex flex-col">
            <div className="flex items-center justify-between px-5 py-5 border-b border-white/10">
              <div className="flex items-center gap-2">
                <ShieldCheck size={20} className="text-[#4d8fdb]" />
                <span className="text-sm font-semibold text-white">DeepTrust Guardian</span>
              </div>
              <button
                aria-label="Close navigation menu"
                onClick={() => setMobileOpen(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto py-4">
              <NavLinks pathname={pathname} onNavigate={() => setMobileOpen(false)} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
