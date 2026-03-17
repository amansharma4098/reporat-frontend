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
        <h1 className="text-2xl font-semibold text-gray-900">Scan History</h1>
        <p className="text-sm text-gray-500 mt-1">All repository scans</p>
      </div>

      {loading ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Loading...</p>
        </div>
      ) : (
        <ScanList scans={scans} />
      )}
    </Shell>
  );
}
