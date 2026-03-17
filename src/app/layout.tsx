import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RepoRat - AI-Powered Repo Scanner",
  description:
    "Scan repos, auto-generate tests, find bugs, file them. All powered by AI.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
