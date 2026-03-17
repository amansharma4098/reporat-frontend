"use client";

import Sidebar from "./Sidebar";

export default function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-64">
        <div className="p-8 max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
