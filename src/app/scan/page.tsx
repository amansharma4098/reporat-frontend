"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Shell from "@/components/layout/Shell";
import ScanForm from "@/components/scan/ScanForm";
import ScanTerminal from "@/components/scan/ScanTerminal";
import { useScanWS } from "@/hooks/useScanWS";

export default function ScanPage() {
  const router = useRouter();
  const [scanId, setScanId] = useState<string | null>(null);
  const { messages, latest } = useScanWS(scanId);

  const handleScanStarted = (id: string) => {
    setScanId(id);
  };

  // Redirect to results when done
  if (latest?.status === "completed" || latest?.status === "failed") {
    setTimeout(() => router.push(`/scans/${scanId}`), 1500);
  }

  return (
    <Shell>
      <div className="mb-8">
        <h1 className="text-2xl font-display font-bold text-slate-900">New Scan</h1>
        <p className="text-sm text-slate-500 mt-1">
          Scan a repository for bugs, security issues, and generate AI tests
        </p>
      </div>

      <div className="grid grid-cols-2 gap-8">
        {/* Form */}
        <div className="card p-6">
          <h2 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-6">
            Scan Configuration
          </h2>
          <ScanForm onScanStarted={handleScanStarted} />
        </div>

        {/* Live Terminal */}
        <div>
          <h2 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-4">
            Live Output
          </h2>
          <ScanTerminal messages={messages} />

          {scanId && (
            <div className="mt-4 text-xs font-mono text-slate-400">
              Scan ID: <span className="text-slate-600">{scanId}</span>
            </div>
          )}
        </div>
      </div>
    </Shell>
  );
}
