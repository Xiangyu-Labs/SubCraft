import Link from "next/link";
import { AlertCircle, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div
      className="flex min-h-screen items-center justify-center px-4"
      style={{ background: "var(--bg)" }}
    >
      <div className="w-full max-w-md text-center">
        <div className="mb-8 flex justify-center">
          <div className="relative">
            <div
              className="select-none text-9xl font-bold"
              style={{ color: "var(--surface2)" }}
            >
              404
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className="flex h-16 w-16 items-center justify-center rounded-full"
                style={{ background: "color-mix(in srgb, var(--primary), transparent 90%)" }}
              >
                <AlertCircle className="h-8 w-8" style={{ color: "var(--primary)" }} />
              </div>
            </div>
          </div>
        </div>
        <h1 className="mb-4 text-2xl font-bold" style={{ color: "var(--text)" }}>
          Page not found
        </h1>
        <p className="mb-8 text-sm" style={{ color: "var(--muted)" }}>
          The page you are looking for does not exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-md px-6 text-sm font-medium text-white shadow-sm transition-all active:scale-[0.99]"
          style={{ background: "var(--primary)" }}
        >
          <Home className="h-4 w-4" />
          Back to Home
        </Link>
      </div>
    </div>
  );
}
