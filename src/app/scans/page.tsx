"use client";

import { useEffect, useState, useMemo } from "react";
import Shell from "@/components/layout/Shell";
import ScanList from "@/components/dashboard/ScanList";
import { api } from "@/lib/api";
import type { ScanSummary } from "@/types";
import { Trash2, Search } from "lucide-react";
import { repoName } from "@/lib/utils";

export default function ScansPage() {
  const [scans, setScans] = useState<ScanSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchScans = () => {
    setLoading(true);
    api.listScans()
      .then((res) => setScans(res.scans))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchScans(); }, []);

  const filteredScans = useMemo(() => {
    let result = scans;
    if (statusFilter !== "all") {
      if (statusFilter === "running") {
        result = result.filter((s) =>
          s.status !== "completed" && s.status !== "failed" && s.status !== "pending"
        );
      } else {
        result = result.filter((s) => s.status === statusFilter);
      }
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((s) => repoName(s.repo_url).toLowerCase().includes(q));
    }
    return result;
  }, [scans, statusFilter, searchQuery]);

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

      {/* Filters */}
      {!loading && scans.length > 0 && (
        <div className="flex items-center gap-3 mb-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field w-40"
          >
            <option value="all">All statuses</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="running">Running</option>
            <option value="pending">Pending</option>
          </select>
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by repo name..."
              className="input-field w-full pl-8"
            />
          </div>
          <span className="text-12 text-zinc-400 ml-auto">
            Showing {filteredScans.length} of {scans.length} scans
          </span>
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center">
          <div className="w-5 h-5 border-2 border-zinc-300 border-t-zinc-900 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-12 text-zinc-400">Loading...</p>
        </div>
      ) : (
        <ScanList scans={filteredScans} onDeleteScan={handleDeleteScan} />
      )}
    </Shell>
  );
}
