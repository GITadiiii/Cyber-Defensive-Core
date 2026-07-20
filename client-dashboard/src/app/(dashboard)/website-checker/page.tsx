import { ShieldCheck, AlertTriangle, GitBranch, Fingerprint, Download } from "lucide-react";

const FEATURES = [
  {
    icon: ShieldCheck,
    title: "Verified site detection",
    desc: "Instantly recognizes official government domains against a maintained allowlist.",
  },
  {
    icon: AlertTriangle,
    title: "Fake gov-site warnings",
    desc: "Flags sites that look official (.gov-style naming) but aren't on the verified list.",
  },
  {
    icon: Fingerprint,
    title: "Typosquat & homograph detection",
    desc: "Catches look-alike domains using character substitution or near-identical spelling.",
  },
  {
    icon: GitBranch,
    title: "Redirect-chain monitoring",
    desc: "Warns if a legitimate-looking page silently redirects you to an unverified site.",
  },
];

export default function WebsiteCheckerPage() {
  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-white">Website Checker — GovShield</h1>
        <p className="mt-1 text-sm text-slate-500">
          GovShield runs as a browser extension, checking every page you visit in real time.
        </p>
      </header>

      <div className="max-w-2xl space-y-6">
        <div className="rounded-xl border border-white/10 bg-white/2 p-6">
          <div className="grid gap-5 sm:grid-cols-2">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex gap-3">
                <Icon size={20} className="mt-0.5 shrink-0 text-[#4d8fdb]" />
                <div>
                  <p className="text-sm font-medium text-white">{title}</p>
                  <p className="mt-0.5 text-sm text-slate-500">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-[#4d8fdb]/30 bg-[#2c5aa0]/10 p-6">
          <a
            href="/govshield-extension.zip"
            download
            className="flex w-full items-center justify-center gap-2 rounded-md bg-[#2c5aa0] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#2c5aa0]/90 sm:w-auto sm:px-6"
          >
            <Download size={16} />
            Download Extension
          </a>
          <p className="mt-2 text-xs text-slate-500">
            Version 1.0 · ~13 KB · For Chrome, Edge, and other Chromium browsers
          </p>

          <p className="mb-2 mt-5 text-sm font-medium text-white">Install locally (unpacked)</p>
          <ol className="list-inside list-decimal space-y-1 text-sm text-slate-400">
            <li>Click <span className="text-slate-300">Download Extension</span> above and unzip the downloaded file</li>
            <li>Open <code className="rounded bg-black/30 px-1.5 py-0.5 text-slate-300">chrome://extensions</code> in Chrome</li>
            <li>Turn on <span className="text-slate-300">Developer mode</span> (top right)</li>
            <li>Click <span className="text-slate-300">Load unpacked</span> and select the unzipped GovShield folder</li>
            <li>Pin the extension and browse — warnings appear automatically</li>
          </ol>
        </div>

        <p className="text-xs text-slate-600">
          A Chrome Web Store listing isn&apos;t published yet — for now, GovShield runs as a
          local unpacked extension.
        </p>
      </div>
    </div>
  );
}