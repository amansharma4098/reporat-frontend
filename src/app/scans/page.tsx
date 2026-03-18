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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Scan History</h1>
          <p className="text-sm text-slate-500 mt-1">All repository scans</p>
        </div>
        {scans.length > 0 && (
          <button
            onClick={handleClearAll}
            disabled={clearing}
            className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-700 transition-colors font-medium"
          >
            {clearing ? (
              <div className="w-3.5 h-3.5 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Trash2 size={14} />
            )}
            Clear All
          </button>
        )}
      </div>

      {loading ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-sm">
          <div className="w-6 h-6 border-2 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Loading...</p>
        </div>
      ) : (
        <ScanList scans={scans} onDeleteScan={handleDeleteScan} />
      )}
    </Shell>
  );
}
