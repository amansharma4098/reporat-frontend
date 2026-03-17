"use client";

import { useEffect, useState } from "react";
import Shell from "@/components/layout/Shell";
import ScanList from "@/components/dashboard/ScanList";
import { api } from "@/lib/api";
import type { ScanSummary } from "@/types";

export default function ScansPage() {
  const [scans, setScans] = useState<ScanSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.listScans()
      .then((res) => setScans(res.scans))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <Shell>
      <div className="mb-8">
        <h1 className="text-2xl font-display font-bold text-zinc-100">Scan History</h1>
        <p className="text-sm text-zinc-500 mt-1">All repository scans</p>
      </div>

      {loading ? (
        <div className="card p-12 text-center">
          <div className="animate-spin text-accent text-2xl mb-3">&#x25E0;</div>
          <p className="text-zinc-500 text-sm font-mono">Loading...</p>
        </div>
      ) : (
        <ScanList scans={scans} />
      )}
    </Shell>
  );
}
