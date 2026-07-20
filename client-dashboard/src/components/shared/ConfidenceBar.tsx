"use client";

import React from "react";

type Tone = "good" | "bad" | "neutral";

interface ConfidenceBarProps {
  label: string;
  value: number; // 0-100
  tone?: Tone;
}

function getToneColor(tone: Tone): string {
  switch (tone) {
    case "good":
      return "bg-emerald-500";
    case "bad":
      return "bg-red-500";
    default:
      return "bg-sky-500";
  }
}

export default function ConfidenceBar({ label, value, tone = "neutral" }: ConfidenceBarProps) {
  const clamped = Math.min(100, Math.max(0, value));
  const barColor = getToneColor(tone);

  return (
    <div className="w-full">
      <div className="flex justify-between text-sm text-gray-300 mb-1">
        <span>{label}</span>
        <span>{clamped.toFixed(1)}%</span>
      </div>
      <div className="w-full h-2 rounded-full bg-gray-700 overflow-hidden">
        <div
          className={`h-full ${barColor} transition-all duration-500`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
