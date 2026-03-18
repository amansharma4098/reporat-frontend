"use client";

import Sidebar from "./Sidebar";
import AuthGuard from "./AuthGuard";

export default function Shell({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 ml-[220px]">
          <div className="px-8 py-6 max-w-[1100px] page-enter">{children}</div>
        </main>
      </div>
    </AuthGuard>
  );
}
