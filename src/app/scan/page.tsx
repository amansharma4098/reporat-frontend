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

  if (latest?.status === "completed" || latest?.status === "failed") {
    setTimeout(() => router.push(`/scans/${scanId}`), 1500);
  }

  return (
    <Shell>
      <div className="mb-6">
        <h1 className="text-22 font-semibold text-zinc-900">New Scan</h1>
        <p className="text-12 text-zinc-400 mt-1">
          Scan a repository for bugs, security issues, and generate AI tests
        </p>
      </div>

      <div className="grid grid-cols-[55fr_45fr] gap-6">
        {/* Form */}
        <div className="bg-white border border-zinc-200 rounded-lg p-5">
          <h2 className="text-11 font-medium text-zinc-400 uppercase tracking-wide mb-4">
            Configuration
          </h2>
          <ScanForm onScanStarted={handleScanStarted} />
        </div>

        {/* Terminal */}
        <div>
          <h2 className="text-11 font-medium text-zinc-400 uppercase tracking-wide mb-3">
            Live Output
          </h2>
          <ScanTerminal messages={messages} />

          {scanId && (
            <p className="mt-3 text-11 font-mono text-zinc-400">
              Scan ID: <span className="text-zinc-600">{scanId}</span>
            </p>
          )}
        </div>
      </div>
    </Shell>
  );
}
