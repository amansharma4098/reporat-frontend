"use client";

import Sidebar from "./Sidebar";
import AuthGuard from "./AuthGuard";

export default function Shell({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar />
        <main className="flex-1 ml-64">
          <div className="p-8 max-w-6xl">{children}</div>
        </main>
      </div>
    </AuthGuard>
  );
}
