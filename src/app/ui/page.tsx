"use client";

import { useState } from "react";
import {
  Check,
  X,
  Info,
  AlertTriangle,
  Trash2,
  Edit3,
  Settings,
  Plus,
  ChevronRight,
  Copy,
  Search,
  Bell,
  Home,
  XIcon,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Design Token values (inline for the showcase page)                 */
/* ------------------------------------------------------------------ */
const colors = [
  { name: "primary", value: "#10a37f", text: "white" },
  { name: "bg", value: "#ffffff", text: "#343541" },
  { name: "surface", value: "#ffffff", text: "#343541" },
  { name: "surface2", value: "#f7f7f8", text: "#343541" },
  { name: "text", value: "#343541", text: "white" },
  { name: "muted", value: "#8e8ea0", text: "white" },
  { name: "border", value: "#e5e5e5", text: "#343541" },
  { name: "ring", value: "#10a37f", text: "white" },
  { name: "danger", value: "#ef4444", text: "white" },
  { name: "warning", value: "#f59e0b", text: "white" },
  { name: "info", value: "#3b82f6", text: "white" },
];

const darkColors = [
  { name: "bg", value: "#343541", text: "#ececf1" },
  { name: "surface", value: "#444654", text: "#ececf1" },
  { name: "surface2", value: "#202123", text: "#ececf1" },
  { name: "text", value: "#ececf1", text: "#343541" },
  { name: "muted", value: "#8e8ea0", text: "white" },
  { name: "border", value: "#565869", text: "#ececf1" },
];

/* ------------------------------------------------------------------ */
/*  Sections                                                            */
/* ------------------------------------------------------------------ */
const sections = [
  "Colors",
  "Typography",
  "Button",
  "Input",
  "Card",
  "Badge",
  "Toast",
  "Table",
  "Dialog",
  "Sidebar",
  "Icons",
];

export default function UIReference() {
  const [activeSection, setActiveSection] = useState("Colors");
  const [dialogOpen, setDialogOpen] = useState(false);

  const scrollTo = (id: string) => {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="flex min-h-screen" style={{ background: "var(--bg)", color: "var(--text)" }}>
      {/* Sidebar */}
      <aside
        className="fixed left-0 top-0 h-screen w-56 overflow-y-auto border-r"
        style={{
          background: "var(--surface)",
          borderColor: "var(--border)",
        }}
      >
        <div className="p-4">
          <h2 className="mb-4 text-lg font-semibold" style={{ color: "var(--text)" }}>
            UI Reference
          </h2>
          <nav className="space-y-1">
            {sections.map((s) => (
              <button
                key={s}
                onClick={() => scrollTo(s)}
                className="block w-full rounded-md px-3 py-2 text-left text-sm transition-colors"
                style={{
                  background: activeSection === s ? "var(--surface2)" : "transparent",
                  color: activeSection === s ? "var(--text)" : "var(--muted)",
                  borderLeft: activeSection === s ? "3px solid var(--primary)" : "3px solid transparent",
                }}
              >
                {s}
              </button>
            ))}
          </nav>
        </div>
      </aside>

      {/* Main */}
      <main className="ml-56 flex-1 p-8 md:p-12">
        {/* Colors */}
        <Section id="Colors" title="Colors">
          <SubTitle>Light Mode</SubTitle>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-6">
            {colors.map((c) => (
              <ColorSwatch key={c.name} {...c} />
            ))}
          </div>

          <SubTitle>Dark Mode</SubTitle>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-6">
            {darkColors.map((c) => (
              <ColorSwatch key={c.name} {...c} />
            ))}
          </div>
        </Section>

        {/* Typography */}
        <Section id="Typography" title="Typography">
          <div className="space-y-6">
            <div>
              <p className="mb-1 text-xs uppercase tracking-wider" style={{ color: "var(--muted)" }}>
                H1 · 24px
              </p>
              <h1 className="text-2xl font-semibold">Page Title</h1>
            </div>
            <div>
              <p className="mb-1 text-xs uppercase tracking-wider" style={{ color: "var(--muted)" }}>
                H2 · 20px
              </p>
              <h2 className="text-xl font-semibold">Section Title</h2>
            </div>
            <div>
              <p className="mb-1 text-xs uppercase tracking-wider" style={{ color: "var(--muted)" }}>
                H3 · 14px Bold
              </p>
              <h3 className="text-sm font-semibold">Card Title</h3>
            </div>
            <div>
              <p className="mb-1 text-xs uppercase tracking-wider" style={{ color: "var(--muted)" }}>
                Body · 14px
              </p>
              <p style={{ color: "var(--text)" }}>
                This is body text. It should be comfortable to read for long periods.
              </p>
            </div>
            <div>
              <p className="mb-1 text-xs uppercase tracking-wider" style={{ color: "var(--muted)" }}>
                Caption · 12px
              </p>
              <p className="text-xs" style={{ color: "var(--muted)" }}>
                Metadata, labels, and secondary information.
              </p>
            </div>
          </div>
        </Section>

        {/* Button */}
        <Section id="Button" title="Button">
          <SubTitle>Variants</SubTitle>
          <div className="flex flex-wrap gap-3">
            <button
              className="h-9 rounded-md px-4 text-sm font-medium text-white shadow-sm transition-all active:scale-[0.99]"
              style={{ background: "var(--primary)" }}
            >
              Primary
            </button>
            <button
              className="h-9 rounded-md border px-4 text-sm font-medium transition-all active:scale-[0.99]"
              style={{ borderColor: "var(--border)", background: "var(--surface2)", color: "var(--text)" }}
            >
              Secondary
            </button>
            <button
              className="h-9 rounded-md border px-4 text-sm font-medium transition-all active:scale-[0.99]"
              style={{ borderColor: "var(--border)", color: "var(--text)" }}
            >
              Outline
            </button>
            <button
              className="h-9 rounded-md px-4 text-sm font-medium transition-all active:scale-[0.99]"
              style={{ color: "var(--text)" }}
            >
              Ghost
            </button>
            <button
              className="h-9 rounded-md px-4 text-sm font-medium text-white shadow-sm transition-all active:scale-[0.99]"
              style={{ background: "var(--danger)" }}
            >
              Destructive
            </button>
            <button
              className="h-9 px-4 text-sm font-medium underline-offset-4 transition-all hover:underline"
              style={{ color: "var(--primary)" }}
            >
              Link
            </button>
          </div>

          <SubTitle>Sizes</SubTitle>
          <div className="flex flex-wrap items-center gap-3">
            <button
              className="h-8 rounded-md px-3 text-xs font-medium text-white transition-all active:scale-[0.99]"
              style={{ background: "var(--primary)" }}
            >
              Small
            </button>
            <button
              className="h-9 rounded-md px-4 text-sm font-medium text-white transition-all active:scale-[0.99]"
              style={{ background: "var(--primary)" }}
            >
              Default
            </button>
            <button
              className="h-10 rounded-md px-8 text-sm font-medium text-white transition-all active:scale-[0.99]"
              style={{ background: "var(--primary)" }}
            >
              Large
            </button>
            <button
              className="flex h-9 w-9 items-center justify-center rounded-md text-white transition-all active:scale-[0.99]"
              style={{ background: "var(--primary)" }}
            >
              <Settings className="h-4 w-4" />
            </button>
          </div>
        </Section>

        {/* Input */}
        <Section id="Input" title="Input">
          <div className="max-w-sm space-y-4">
            <input
              type="text"
              placeholder="Placeholder text"
              className="h-9 w-full rounded-md border bg-transparent px-3 text-sm outline-none transition-all focus-visible:ring-2"
              style={{
                background: "var(--surface)",
                borderColor: "var(--border)",
                color: "var(--text)",
              }}
            />
            <input
              type="text"
              value="Filled input"
              readOnly
              className="h-9 w-full rounded-md border bg-transparent px-3 text-sm outline-none"
              style={{
                background: "var(--surface)",
                borderColor: "var(--border)",
                color: "var(--text)",
              }}
            />
            <input
              type="text"
              placeholder="Disabled"
              disabled
              className="h-9 w-full rounded-md border bg-transparent px-3 text-sm opacity-50 outline-none"
              style={{
                background: "var(--surface)",
                borderColor: "var(--border)",
                color: "var(--text)",
              }}
            />
            <textarea
              placeholder="Textarea..."
              rows={3}
              className="w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none transition-all focus-visible:ring-2"
              style={{
                background: "var(--surface)",
                borderColor: "var(--border)",
                color: "var(--text)",
              }}
            />
          </div>
        </Section>

        {/* Card */}
        <Section id="Card" title="Card">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Basic */}
            <div
              className="rounded-xl border p-6"
              style={{ background: "var(--surface)", borderColor: "var(--border)" }}
            >
              <h3 className="mb-1 text-sm font-semibold">Card Title</h3>
              <p className="mb-4 text-sm" style={{ color: "var(--muted)" }}>
                Card description or subtitle text.
              </p>
              <p className="text-sm" style={{ color: "var(--text)" }}>
                This is the main content area of the card. It can contain text,
                forms, or other components.
              </p>
            </div>

            {/* With shadow */}
            <div
              className="rounded-xl border p-6"
              style={{
                background: "var(--surface)",
                borderColor: "var(--border)",
                boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
              }}
            >
              <h3 className="mb-1 text-sm font-semibold">Floating Card</h3>
              <p className="mb-4 text-sm" style={{ color: "var(--muted)" }}>
                With hover/float shadow applied.
              </p>
              <p className="text-sm" style={{ color: "var(--text)" }}>
                Shadows are reserved for floating layers like Dialogs and
                Popovers.
              </p>
            </div>

            {/* Interactive */}
            <div
              className="cursor-pointer rounded-xl border p-6 transition-all hover:-translate-y-0.5"
              style={{
                background: "var(--surface)",
                borderColor: "var(--border)",
              }}
            >
              <h3 className="mb-1 text-sm font-semibold">Interactive Card</h3>
              <p className="text-sm" style={{ color: "var(--muted)" }}>
                Hover to see the border highlight and slight lift.
              </p>
            </div>

            {/* With header / footer */}
            <div
              className="overflow-hidden rounded-xl border"
              style={{ background: "var(--surface)", borderColor: "var(--border)" }}
            >
              <div className="border-b p-4" style={{ borderColor: "var(--border)" }}>
                <h3 className="text-sm font-semibold">Header</h3>
              </div>
              <div className="p-4">
                <p className="text-sm" style={{ color: "var(--text)" }}>
                  Content area with header and footer.
                </p>
              </div>
              <div
                className="flex justify-end border-t p-4"
                style={{ borderColor: "var(--border)" }}
              >
                <button
                  className="h-9 rounded-md px-4 text-sm font-medium text-white"
                  style={{ background: "var(--primary)" }}
                >
                  Action
                </button>
              </div>
            </div>
          </div>
        </Section>

        {/* Badge */}
        <Section id="Badge" title="Badge">
          <div className="flex flex-wrap gap-2">
            <Badge name="Default" bg="var(--surface2)" text="var(--text)" />
            <Badge name="Success" bg="var(--primary)" text="white" />
            <Badge name="Warning" bg="var(--warning)" text="white" />
            <Badge name="Error" bg="var(--danger)" text="white" />
            <Badge name="Info" bg="var(--info)" text="white" />
          </div>
        </Section>

        {/* Toast */}
        <Section id="Toast" title="Toast">
          <div className="space-y-3">
            <ToastItem variant="success" message="Changes saved successfully" />
            <ToastItem variant="warning" message="Please review your input" />
            <ToastItem variant="error" message="Failed to save changes" />
            <ToastItem variant="info" message="New update available" />
          </div>
        </Section>

        {/* Table */}
        <Section id="Table" title="Table">
          <div
            className="overflow-hidden rounded-lg border"
            style={{ background: "var(--surface)", borderColor: "var(--border)" }}
          >
            <table className="w-full border-collapse">
              <thead>
                <tr style={{ background: "var(--surface2)" }}>
                  {["Name", "Role", "Status", "Action"].map((h) => (
                    <th
                      key={h}
                      className="border-b px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider"
                      style={{ borderColor: "var(--border)", color: "var(--text)" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { name: "Alice", role: "Admin", status: "Active" },
                  { name: "Bob", role: "Editor", status: "Active" },
                  { name: "Charlie", role: "Viewer", status: "Pending" },
                ].map((row) => (
                  <tr
                    key={row.name}
                    className="transition-colors"
                    style={{
                      borderBottom: "1px solid var(--border)",
                    }}
                  >
                    <td className="px-4 py-3 text-sm" style={{ color: "var(--text)" }}>
                      {row.name}
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: "var(--muted)" }}>
                      {row.role}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className="inline-flex items-center rounded px-2 py-0.5 text-xs font-medium"
                        style={{
                          background: row.status === "Active" ? "var(--primary)" : "var(--warning)",
                          color: "white",
                        }}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors"
                        style={{ color: "var(--muted)" }}
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        {/* Dialog */}
        <Section id="Dialog" title="Dialog">
          <button
            onClick={() => setDialogOpen(true)}
            className="h-9 rounded-md px-4 text-sm font-medium text-white shadow-sm transition-all active:scale-[0.99]"
            style={{ background: "var(--primary)" }}
          >
            Open Dialog
          </button>

          {dialogOpen && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              style={{ background: "rgba(0,0,0,0.4)" }}
              onClick={() => setDialogOpen(false)}
            >
              <div
                className="w-full max-w-md rounded-lg border p-6"
                style={{
                  background: "var(--surface)",
                  borderColor: "var(--border)",
                  boxShadow: "0 20px 50px rgba(0,0,0,0.3)",
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Dialog Title</h3>
                  <button
                    onClick={() => setDialogOpen(false)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors"
                    style={{ color: "var(--muted)" }}
                  >
                    <XIcon className="h-4 w-4" />
                  </button>
                </div>
                <p className="mb-6 text-sm" style={{ color: "var(--muted)" }}>
                  This is a dialog component. It uses a modal shadow and
                  elevated z-index. Press Escape or click outside to close.
                </p>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setDialogOpen(false)}
                    className="h-9 rounded-md border px-4 text-sm font-medium transition-all"
                    style={{ borderColor: "var(--border)", color: "var(--text)" }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => setDialogOpen(false)}
                    className="h-9 rounded-md px-4 text-sm font-medium text-white transition-all"
                    style={{ background: "var(--primary)" }}
                  >
                    Confirm
                  </button>
                </div>
              </div>
            </div>
          )}
        </Section>

        {/* Sidebar */}
        <Section id="Sidebar" title="Sidebar List Item">
          <div className="max-w-sm space-y-1">
            <SidebarItem title="Dashboard" meta="2 min ago" active />
            <SidebarItem title="Users" meta="1 hour ago" />
            <SidebarItem title="Settings" meta="Yesterday" />
            <SidebarItem title="Help" meta="3 days ago" />
          </div>
        </Section>

        {/* Icons */}
        <Section id="Icons" title="Icons">
          <div className="flex flex-wrap gap-4">
            {[
              Home,
              Settings,
              Search,
              Bell,
              Plus,
              Trash2,
              Edit3,
              Copy,
              ChevronRight,
              Check,
              X,
              Info,
            ].map((Icon, i) => (
              <div
                key={i}
                className="flex h-10 w-10 items-center justify-center rounded-md"
                style={{ background: "var(--surface2)" }}
              >
                <Icon className="h-5 w-5" style={{ color: "var(--text)" }} />
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm" style={{ color: "var(--muted)" }}>
            Using Lucide React. Default 20px, inherits text color.
          </p>
        </Section>
      </main>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mb-16 scroll-mt-8">
      <h2 className="mb-6 text-xl font-semibold" style={{ color: "var(--text)" }}>
        {title}
      </h2>
      {children}
    </section>
  );
}

function SubTitle({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="mb-3 mt-6 text-xs font-medium uppercase tracking-wider" style={{ color: "var(--muted)" }}>
      {children}
    </h4>
  );
}

function ColorSwatch({ name, value, text }: { name: string; value: string; text: string }) {
  return (
    <div className="overflow-hidden rounded-lg border" style={{ borderColor: "var(--border)" }}>
      <div className="h-16 w-full" style={{ background: value }} />
      <div className="p-2">
        <p className="text-xs font-medium" style={{ color: "var(--text)" }}>
          {name}
        </p>
        <p className="text-[10px] font-mono" style={{ color: "var(--muted)" }}>
          {value}
        </p>
      </div>
    </div>
  );
}

function Badge({ name, bg, text }: { name: string; bg: string; text: string }) {
  return (
    <span
      className="inline-flex items-center rounded px-2 py-0.5 text-xs font-medium"
      style={{ background: bg, color: text }}
    >
      {name}
    </span>
  );
}

function ToastItem({ variant, message }: { variant: string; message: string }) {
  const borderColors: Record<string, string> = {
    success: "var(--primary)",
    warning: "var(--warning)",
    error: "var(--danger)",
    info: "var(--info)",
  };

  return (
    <div
      className="flex max-w-sm items-center gap-3 rounded-lg border-l-[3px] p-3"
      style={{
        background: "var(--surface)",
        borderColor: "var(--border)",
        borderLeftColor: borderColors[variant] || borderColors.info,
      }}
    >
      {variant === "success" && <Check className="h-4 w-4 shrink-0" style={{ color: "var(--primary)" }} />}
      {variant === "warning" && <AlertTriangle className="h-4 w-4 shrink-0" style={{ color: "var(--warning)" }} />}
      {variant === "error" && <X className="h-4 w-4 shrink-0" style={{ color: "var(--danger)" }} />}
      {variant === "info" && <Info className="h-4 w-4 shrink-0" style={{ color: "var(--info)" }} />}
      <p className="text-sm" style={{ color: "var(--text)" }}>
        {message}
      </p>
    </div>
  );
}

function SidebarItem({
  title,
  meta,
  active = false,
}: {
  title: string;
  meta: string;
  active?: boolean;
}) {
  return (
    <div
      className="flex cursor-pointer flex-col gap-1 rounded-md px-3 py-2 transition-colors"
      style={{
        background: active ? "var(--surface2)" : "transparent",
        borderLeft: active ? "3px solid var(--primary)" : "3px solid transparent",
        paddingLeft: active ? "calc(0.75rem - 3px)" : "0.75rem",
      }}
    >
      <span className="text-sm font-medium" style={{ color: "var(--text)" }}>
        {title}
      </span>
      <span className="text-xs" style={{ color: "var(--muted)" }}>
        {meta}
      </span>
    </div>
  );
}
