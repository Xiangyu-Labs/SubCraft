import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6">
      <h1 className="text-2xl font-semibold">My App</h1>
      <Link
        href="/ui"
        className="h-9 rounded-md px-4 text-sm font-medium text-white shadow-sm transition-all active:scale-[0.99]"
        style={{ background: "var(--primary)" }}
      >
        组件展示
      </Link>
    </main>
  );
}
