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
  completed: "text-accent",
  failed: "text-red-400",
};

export default function ScanTerminal({ messages }: { messages: WSMessage[] }) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="card overflow-hidden">
      {/* Terminal header */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-surface-3 border-b border-surface-4">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
        </div>
        <span className="text-xs font-mono text-zinc-500 ml-2">reporat scan --live</span>
      </div>

      {/* Terminal body */}
      <div className="p-4 max-h-80 overflow-y-auto font-mono text-xs space-y-1 bg-surface-0/50">
        {messages.length === 0 && (
          <div className="text-zinc-600">
            <span className="text-accent">$</span> Waiting for scan to start...
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className="flex gap-2 animate-fade-in">
            <span className="text-zinc-600 select-none">[{new Date().toLocaleTimeString()}]</span>
            <span className={cn(statusColors[msg.status] || "text-zinc-400")}>
              [{msg.status}]
            </span>
            <span className="text-zinc-300">{msg.message}</span>
          </div>
        ))}
        <div ref={endRef} />
      </div>
    </div>
  );
}
