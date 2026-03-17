"use client";

import { useRef, useEffect } from "react";
import type { WSMessage } from "@/types";
import { cn } from "@/lib/utils";

const statusColors: Record<string, string> = {
  cloning: "text-blue-400",
  analyzing: "text-yellow-400",
  generating_tests: "text-purple-400",
  running_tests: "text-orange-400",
  filing_bugs: "text-cyan-400",
  completed: "text-emerald-400",
  failed: "text-red-400",
};

export default function ScanTerminal({ messages }: { messages: WSMessage[] }) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm">
      {/* Terminal header */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-800 border-b border-gray-700">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500/70" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
          <div className="w-3 h-3 rounded-full bg-green-500/70" />
        </div>
        <span className="text-xs font-mono text-gray-400 ml-2">reporat scan --live</span>
      </div>

      {/* Terminal body */}
      <div className="p-4 max-h-80 overflow-y-auto font-mono text-xs space-y-1 bg-gray-900">
        {messages.length === 0 && (
          <div className="text-gray-500">
            <span className="text-emerald-400">$</span> Waiting for scan to start...
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className="flex gap-2 animate-fade-in">
            <span className="text-gray-600 select-none">[{new Date().toLocaleTimeString()}]</span>
            <span className={cn(statusColors[msg.status] || "text-gray-400")}>
              [{msg.status}]
            </span>
            <span className="text-gray-300">{msg.message}</span>
          </div>
        ))}
        <div ref={endRef} />
      </div>
    </div>
  );
}
