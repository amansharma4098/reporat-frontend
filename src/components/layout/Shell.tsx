"use client";

import Sidebar from "./Sidebar";
import AuthGuard from "./AuthGuard";

export default function Shell({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-slate-100">
        <Sidebar />
        <main className="flex-1 ml-60">
          <div className="px-8 py-6 max-w-6xl page-enter">{children}</div>
        </main>
      </div>
    </AuthGuard>
  );
}
