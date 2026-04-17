"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RefreshCcw, Home } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div
      className="flex min-h-screen items-center justify-center p-4"
      style={{ background: "var(--bg)" }}
    >
      <div
        className="w-full max-w-md space-y-6 rounded-2xl border p-8 text-center"
        style={{
          background: "var(--surface)",
          borderColor: "var(--border)",
          boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
        }}
      >
        <div
          className="mx-auto flex h-16 w-16 items-center justify-center rounded-full"
          style={{
            background: "color-mix(in srgb, var(--danger), transparent 90%)",
            color: "var(--danger)",
          }}
        >
          <AlertCircle className="h-10 w-10" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>
            Something went wrong
          </h1>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            {error.message || "An unexpected error occurred. Please try again."}
          </p>
          {error.digest && (
            <p
              className="mt-4 rounded p-2 font-mono text-xs"
              style={{
                background: "var(--surface2)",
                color: "var(--muted)",
              }}
            >
              Error ID: {error.digest}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            onClick={() => reset()}
            className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-md text-sm font-medium text-white transition-all active:scale-[0.99]"
            style={{ background: "var(--primary)" }}
          >
            <RefreshCcw className="h-4 w-4" />
            Try Again
          </button>
          <Link
            href="/"
            className="inline-flex h-11 flex-1 items-center justify-center rounded-md border text-sm font-medium transition-all"
            style={{ borderColor: "var(--border)", color: "var(--text)" }}
          >
            <Home className="mr-2 h-4 w-4" />
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
