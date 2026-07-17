"use client";

import dynamic from "next/dynamic";

const IncidentMap = dynamic(() => import("./IncidentMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-gray-400">
      Loading map…
    </div>
  ),
});

export default function IncidentMapClient() {
  return <IncidentMap />;
}
