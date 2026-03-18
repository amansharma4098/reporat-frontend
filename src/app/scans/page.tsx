"use client";

import { useEffect, useState } from "react";
import Shell from "@/components/layout/Shell";
import ScanList from "@/components/dashboard/ScanList";
import { api } from "@/lib/api";
import type { ScanSummary } from "@/types";
import { Trash2 } from "lucide-react";

export default function ScansPage() {
  const [scans, setScans] = useState<ScanSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);

  const fetchScans = () => {
    setLoading(true);
    api.listScans()
      .then((res) => setScans(res.scans))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchScans(); }, []);

  const handleClearAll = async () => {
    if (!window.confirm("Delete all scan history?")) return;
    setClearing(true);
    try {
      await api.deleteAllScans();
      setScans([]);
    } catch {
      // ignore
    } finally {
      setClearing(false);
    }
  };

  const handleDeleteScan = async (scanId: string) => {
    if (!window.confirm("Are you sure you want to delete this scan?")) return;
    try {
      await api.deleteScan(scanId);
      setScans((prev) => prev.filter((s) => s.scan_id !== scanId));
    } catch {
      // ignore
    }
  };

  return (
    <Shell>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-22 font-semibold text-zinc-900">Scan History</h1>
        {scans.length > 0 && (
          <button
            onClick={handleClearAll}
            disabled={clearing}
            className="btn-danger flex items-center gap-1.5"
          >
            {clearing ? (
              <div className="w-3 h-3 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Trash2 size={13} strokeWidth={1.5} />
            )}
            Clear All
          </button>
        )}
      </div>

      {loading ? (
        <div className="py-12 text-center">
          <div className="w-5 h-5 border-2 border-zinc-300 border-t-zinc-900 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-12 text-zinc-400">Loading...</p>
        </div>
      ) : (
        <ScanList scans={scans} onDeleteScan={handleDeleteScan} />
      )}
    </Shell>
  );
}
