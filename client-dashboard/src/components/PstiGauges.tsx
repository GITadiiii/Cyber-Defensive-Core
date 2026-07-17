"use client";

import { useEffect, useState } from "react";
import { Card, Metric, Text, ProgressBar, Grid, Flex, BadgeDelta } from "@tremor/react";
import { fetchIncidents } from "@/lib/api";
import { onThreatBroadcast } from "@/lib/socket";
import type { Incident, ThreatBroadcastPayload, VerdictState } from "@/lib/types";

interface Distribution {
  LOW: number;
  MEDIUM: number;
  HIGH: number;
  CRITICAL: number;
  total: number;
  avgPsti: number;
}

function computeDistribution(incidents: Incident[]): Distribution {
  const counts: Record<VerdictState, number> = {
    LOW: 0,
    MEDIUM: 0,
    HIGH: 0,
    CRITICAL: 0,
  };
  let pstiSum = 0;

  for (const inc of incidents) {
    counts[inc.verdict_state] += 1;
    pstiSum += inc.threat_scores.psti_composite;
  }

  const total = incidents.length;
  return {
    ...counts,
    total,
    avgPsti: total > 0 ? pstiSum / total : 0,
  };
}

const VERDICT_COLOR: Record<VerdictState, "emerald" | "yellow" | "orange" | "red"> = {
  LOW: "emerald",
  MEDIUM: "yellow",
  HIGH: "orange",
  CRITICAL: "red",
};

export default function PstiGauges() {
  const [dist, setDist] = useState<Distribution | null>(null);
  const [connected, setConnected] = useState(false);
  const [status, setStatus] = useState<"loading" | "ready" | "unreachable">(
    "loading"
  );

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const res = await fetchIncidents({ limit: 500 });
      if (cancelled) return;
      if (!res) {
        setStatus("unreachable");
        return;
      }
      setDist(computeDistribution(res.data));
      setStatus("ready");
    }

    load();
    const interval = setInterval(load, 15000);

    const unsubscribe = onThreatBroadcast((payload: ThreatBroadcastPayload) => {
      setConnected(true);
      setDist((prev) => {
        const base = prev ?? {
          LOW: 0,
          MEDIUM: 0,
          HIGH: 0,
          CRITICAL: 0,
          total: 0,
          avgPsti: 0,
        };
        const nextTotal = base.total + 1;
        const nextPstiSum =
          base.avgPsti * base.total + payload.threat_scores.psti_composite;
        return {
          ...base,
          [payload.verdict_state]: base[payload.verdict_state] + 1,
          total: nextTotal,
          avgPsti: nextPstiSum / nextTotal,
        };
      });
      setStatus("ready");
    });

    return () => {
      cancelled = true;
      clearInterval(interval);
      unsubscribe();
    };
  }, []);

  if (status === "unreachable") {
    return (
      <Card className="border-dashed">
        <Text>No data — could not reach the incidents API.</Text>
      </Card>
    );
  }

  if (status === "loading" || !dist) {
    return (
      <Card>
        <Text>Loading PSTI distribution…</Text>
      </Card>
    );
  }

  const verdicts: VerdictState[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

  return (
    <div className="space-y-4">
      <Flex justifyContent="between" alignItems="center">
        <Text className="font-medium">Live PSTI Score Distribution</Text>
        <BadgeDelta deltaType={connected ? "increase" : "unchanged"}>
          {connected ? "Live" : "Polling"}
        </BadgeDelta>
      </Flex>

      <Card>
        <Text>Average PSTI Composite</Text>
        <Metric>{dist.avgPsti.toFixed(1)}</Metric>
        <ProgressBar value={dist.avgPsti} color="red" className="mt-3" />
      </Card>

      <Grid numItemsSm={2} numItemsLg={4} className="gap-4">
        {verdicts.map((v) => (
          <Card key={v} decoration="top" decorationColor={VERDICT_COLOR[v]}>
            <Text>{v}</Text>
            <Metric>{dist[v]}</Metric>
            <Text className="mt-1 text-xs text-gray-500">
              {dist.total > 0 ? ((dist[v] / dist.total) * 100).toFixed(0) : 0}%
              of {dist.total}
            </Text>
          </Card>
        ))}
      </Grid>
    </div>
  );
}
