"use client";

import { useState } from "react";
import { format, subDays } from "date-fns";
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
  Calendar as CalendarIcon,
  CreditCard,
  User,
  LogOut,
  MoreHorizontal,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";

/* ------------------------------------------------------------------ */
/*  Design Token values                                                  */
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

const sections = [
  "Colors",
  "Typography",
  "Button",
  "Input",
  "Select",
  "Dropdown",
  "Popover",
  "Tooltip",
  "Calendar",
  "Card",
  "Badge",
  "Toast",
  "Table",
  "Dialog",
  "Sidebar",
  "Motion",
  "Icons",
];

export default function UIReference() {
  const [activeSection, setActiveSection] = useState("Colors");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [dropdownChecks, setDropdownChecks] = useState({
    notifications: true,
    autoSave: false,
  });
  const [dropdownRadio, setDropdownRadio] = useState("system");

  const scrollTo = (id: string) => {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  const handleToday = () => {
    const today = new Date();
    setDate(today);
    setCalendarOpen(false);
  };

  const handleYesterday = () => {
    const yesterday = subDays(new Date(), 1);
    setDate(yesterday);
    setCalendarOpen(false);
  };

  const handleClearDate = () => {
    setDate(undefined);
    setCalendarOpen(false);
  };

  return (
    <div className="flex min-h-screen" style={{ background: "var(--bg)", color: "var(--text)" }}>
      {/* Sidebar */}
      <aside
        className="fixed left-0 top-0 h-screen w-56 overflow-y-auto border-r"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      >
        <div className="p-4">
          <h2 className="mb-4 text-lg font-semibold">UI Reference</h2>
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
            {[
              { label: "H1 · 24px", el: <h1 className="text-2xl font-semibold">Page Title</h1> },
              { label: "H2 · 20px", el: <h2 className="text-xl font-semibold">Section Title</h2> },
              { label: "H3 · 14px Bold", el: <h3 className="text-sm font-semibold">Card Title</h3> },
              { label: "Body · 14px", el: <p>This is body text. Comfortable for long periods.</p> },
              { label: "Caption · 12px", el: <p className="text-xs" style={{ color: "var(--muted)" }}>Metadata, labels, secondary info.</p> },
            ].map((item) => (
              <div key={item.label}>
                <p className="mb-1 text-xs uppercase tracking-wider" style={{ color: "var(--muted)" }}>
                  {item.label}
                </p>
                {item.el}
              </div>
            ))}
          </div>
        </Section>

        {/* Button */}
        <Section id="Button" title="Button">
          <SubTitle>Variants</SubTitle>
          <div className="flex flex-wrap gap-3">
            <Btn style="primary">Primary</Btn>
            <Btn style="secondary">Secondary</Btn>
            <Btn style="outline">Outline</Btn>
            <Btn style="ghost">Ghost</Btn>
            <Btn style="destructive">Destructive</Btn>
            <Btn style="link">Link</Btn>
          </div>
          <SubTitle>Sizes</SubTitle>
          <div className="flex flex-wrap items-center gap-3">
            <Btn size="sm" style="primary">Small</Btn>
            <Btn style="primary">Default</Btn>
            <Btn size="lg" style="primary">Large</Btn>
            <Btn style="primary" icon><Settings className="h-4 w-4" /></Btn>
          </div>
        </Section>

        {/* Input */}
        <Section id="Input" title="Input">
          <div className="max-w-sm space-y-4">
            <Input placeholder="Placeholder text" />
            <Input value="Filled input" readOnly />
            <Input placeholder="Disabled" disabled />
            <textarea
              placeholder="Textarea..."
              rows={3}
              className="w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none transition-all focus-visible:ring-2 focus-visible:ring-ring/50"
              style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" }}
            />
          </div>
        </Section>

        {/* Select */}
        <Section id="Select" title="Select">
          <div className="max-w-sm space-y-4">
            <Select>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose a framework" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="next">Next.js</SelectItem>
                <SelectItem value="react">React</SelectItem>
                <SelectItem value="vue">Vue</SelectItem>
                <SelectItem value="svelte">Svelte</SelectItem>
              </SelectContent>
            </Select>
            <Select disabled>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Disabled select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="a">Option A</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Section>

        {/* Dropdown Menu */}
        <Section id="Dropdown" title="Dropdown Menu">
          <div className="flex flex-wrap gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="inline-flex h-9 items-center justify-center gap-2 rounded-md border px-4 text-sm font-medium transition-all active:scale-[0.99]" style={{ borderColor: "var(--border)", color: "var(--text)" }}>
                  <Settings className="h-4 w-4" /> Options
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem><User className="mr-2 h-4 w-4" /> Profile</DropdownMenuItem>
                <DropdownMenuItem><CreditCard className="mr-2 h-4 w-4" /> Billing</DropdownMenuItem>
                <DropdownMenuItem><Settings className="mr-2 h-4 w-4" /> Settings</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem><LogOut className="mr-2 h-4 w-4" /> Log out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="inline-flex h-9 items-center justify-center gap-2 rounded-md border px-4 text-sm font-medium transition-all active:scale-[0.99]" style={{ borderColor: "var(--border)", color: "var(--text)" }}>
                  <MoreHorizontal className="h-4 w-4" /> With Checkbox
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <DropdownMenuLabel>Preferences</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem
                  checked={dropdownChecks.notifications}
                  onCheckedChange={(v) => setDropdownChecks((p) => ({ ...p, notifications: !!v }))}
                >
                  Notifications
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={dropdownChecks.autoSave}
                  onCheckedChange={(v) => setDropdownChecks((p) => ({ ...p, autoSave: !!v }))}
                >
                  Auto Save
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="inline-flex h-9 items-center justify-center gap-2 rounded-md border px-4 text-sm font-medium transition-all active:scale-[0.99]" style={{ borderColor: "var(--border)", color: "var(--text)" }}>
                  <MoreHorizontal className="h-4 w-4" /> With Radio
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <DropdownMenuLabel>Theme</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup value={dropdownRadio} onValueChange={setDropdownRadio}>
                  <DropdownMenuRadioItem value="light">Light</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="dark">Dark</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="system">System</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </Section>

        {/* Popover */}
        <Section id="Popover" title="Popover">
          <div className="flex flex-wrap gap-4">
            <Popover>
              <PopoverTrigger asChild>
                <button className="inline-flex h-9 items-center justify-center rounded-md px-4 text-sm font-medium text-white shadow-sm transition-all active:scale-[0.99]" style={{ background: "var(--primary)" }}>
                  Open Popover
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-80" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">Dimensions</h4>
                  <p className="text-sm" style={{ color: "var(--muted)" }}>
                    Set the dimensions for the layer.
                  </p>
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <div>
                      <label className="mb-1 block text-xs" style={{ color: "var(--muted)" }}>Width</label>
                      <Input value="100%" readOnly />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs" style={{ color: "var(--muted)" }}>Height</label>
                      <Input value="auto" readOnly />
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </Section>

        {/* Tooltip */}
        <Section id="Tooltip" title="Tooltip">
          <TooltipProvider>
            <div className="flex flex-wrap gap-6">
              {[
                { label: "Hover me", tip: "This is a tooltip" },
                { label: "Top", tip: "Appears on top" },
                { label: "Info", tip: "Extra information here" },
              ].map((t) => (
                <Tooltip key={t.label}>
                  <TooltipTrigger asChild>
                    <button className="inline-flex h-9 items-center justify-center rounded-md border px-4 text-sm font-medium transition-all active:scale-[0.99]" style={{ borderColor: "var(--border)", color: "var(--text)" }}>
                      {t.label}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t.tip}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </TooltipProvider>
        </Section>

        {/* Calendar */}
        <Section id="Calendar" title="Calendar">
          <div className="flex flex-col gap-6 md:flex-row md:items-start">
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <button
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-md border px-3 text-sm font-normal transition-all active:scale-[0.99]"
                  style={{
                    borderColor: "var(--border)",
                    color: date ? "var(--text)" : "var(--muted)",
                    background: "var(--surface)",
                  }}
                >
                  <CalendarIcon className="h-4 w-4 shrink-0" />
                  <span className="truncate">
                    {date ? format(date, "yyyy-MM-dd") : "选择日期"}
                  </span>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start" sideOffset={4} style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                {/* Shortcuts */}
                <div className="grid grid-cols-3 gap-px border-b" style={{ background: "var(--border)" }}>
                  <button
                    className="inline-flex h-8 items-center justify-center text-xs font-medium transition-colors hover:bg-accent bg-transparent"
                    style={{ background: "var(--surface)" }}
                    onClick={handleToday}
                  >
                    今天
                  </button>
                  <button
                    className="inline-flex h-8 items-center justify-center text-xs font-medium transition-colors hover:bg-accent bg-transparent"
                    style={{ background: "var(--surface)" }}
                    onClick={handleYesterday}
                  >
                    昨天
                  </button>
                  <button
                    className="inline-flex h-8 items-center justify-center text-xs font-medium transition-colors hover:bg-accent bg-transparent"
                    style={{ background: "var(--surface)", color: "var(--muted)" }}
                    onClick={handleClearDate}
                  >
                    清除
                  </button>
                </div>
                <Calendar
                  value={date}
                  onSelect={(d) => {
                    setDate(d);
                    if (d) setCalendarOpen(false);
                  }}
                />
              </PopoverContent>
            </Popover>
            <div className="space-y-2">
              <p className="text-sm" style={{ color: "var(--muted)" }}>
                Selected date:
              </p>
              <p className="text-lg font-semibold">
                {date ? format(date, "yyyy年M月d日") : "None"}
              </p>
            </div>
          </div>
        </Section>

        {/* Card */}
        <Section id="Card" title="Card">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <h3 className="mb-1 text-sm font-semibold">Card Title</h3>
              <p className="mb-4 text-sm" style={{ color: "var(--muted)" }}>Card description.</p>
              <p className="text-sm">Main content area.</p>
            </Card>
            <Card style={{ boxShadow: "0 10px 30px rgba(0,0,0,0.1)" }}>
              <h3 className="mb-1 text-sm font-semibold">Floating Card</h3>
              <p className="text-sm" style={{ color: "var(--muted)" }}>With float shadow.</p>
            </Card>
            <Card className="cursor-pointer transition-all hover:-translate-y-0.5">
              <h3 className="mb-1 text-sm font-semibold">Interactive Card</h3>
              <p className="text-sm" style={{ color: "var(--muted)" }}>Hover to lift.</p>
            </Card>
            <div className="overflow-hidden rounded-xl border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
              <div className="border-b p-4" style={{ borderColor: "var(--border)" }}>
                <h3 className="text-sm font-semibold">Header</h3>
              </div>
              <div className="p-4">
                <p className="text-sm">Content with header and footer.</p>
              </div>
              <div className="flex justify-end border-t p-4" style={{ borderColor: "var(--border)" }}>
                <Btn style="primary">Action</Btn>
              </div>
            </div>
          </div>
        </Section>

        {/* Badge */}
        <Section id="Badge" title="Badge">
          <div className="flex flex-wrap gap-2">
            <BadgeComp name="Default" bg="var(--surface2)" text="var(--text)" />
            <BadgeComp name="Success" bg="var(--primary)" text="white" />
            <BadgeComp name="Warning" bg="var(--warning)" text="white" />
            <BadgeComp name="Error" bg="var(--danger)" text="white" />
            <BadgeComp name="Info" bg="var(--info)" text="white" />
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
          <div className="overflow-hidden rounded-lg border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <table className="w-full border-collapse">
              <thead>
                <tr style={{ background: "var(--surface2)" }}>
                  {["Name", "Role", "Status", "Action"].map((h) => (
                    <th key={h} className="border-b px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider" style={{ borderColor: "var(--border)" }}>
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
                  <tr key={row.name} style={{ borderBottom: "1px solid var(--border)" }} className="transition-colors hover:bg-surface2/50">
                    <td className="px-4 py-3 text-sm">{row.name}</td>
                    <td className="px-4 py-3 text-sm" style={{ color: "var(--muted)" }}>{row.role}</td>
                    <td className="px-4 py-3 text-sm">
                      <BadgeComp name={row.status} bg={row.status === "Active" ? "var(--primary)" : "var(--warning)"} text="white" />
                    </td>
                    <td className="px-4 py-3">
                      <button className="inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors" style={{ color: "var(--muted)" }}>
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
          <Btn style="primary" onClick={() => setDialogOpen(true)}>Open Dialog</Btn>
          {dialogOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.4)" }} onClick={() => setDialogOpen(false)}>
              <div className="w-full max-w-md rounded-lg border p-6" style={{ background: "var(--surface)", borderColor: "var(--border)", boxShadow: "0 20px 50px rgba(0,0,0,0.3)" }} onClick={(e) => e.stopPropagation()}>
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Dialog Title</h3>
                  <button onClick={() => setDialogOpen(false)} className="inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors" style={{ color: "var(--muted)" }}>
                    <XIcon className="h-4 w-4" />
                  </button>
                </div>
                <p className="mb-6 text-sm" style={{ color: "var(--muted)" }}>Dialog with modal shadow.</p>
                <div className="flex justify-end gap-2">
                  <Btn style="outline" onClick={() => setDialogOpen(false)}>Cancel</Btn>
                  <Btn style="primary" onClick={() => setDialogOpen(false)}>Confirm</Btn>
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

        {/* Motion */}
        <Section id="Motion" title="Motion">
          <SubTitle>Allowed Animations</SubTitle>
          <div className="flex flex-wrap gap-4">
            <MotionBox label="Fade In" className="animate-[fadeIn_0.5s_ease-out]" />
            <MotionBox label="Scale 0.99" className="transition-transform active:scale-[0.99]" />
            <MotionBox label="Translate Y" className="transition-transform hover:-translate-y-0.5" />
            <MotionBox label="Color Shift" className="transition-colors hover:opacity-80" />
          </div>
          <SubTitle>Transitions</SubTitle>
          <div className="max-w-sm space-y-3">
            <div className="rounded-md border p-3 text-sm transition-all hover:border-primary" style={{ borderColor: "var(--border)" }}>
              Hover this box to see border color transition
            </div>
            <div className="rounded-md p-3 text-sm text-white transition-all hover:brightness-110" style={{ background: "var(--primary)" }}>
              Hover this box to see brightness transition
            </div>
          </div>
          <SubTitle>Dropdown / Popover Animations</SubTitle>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            Dropdown, Popover, Tooltip, and Select components all use built-in Radix UI animations:
            fade-in, zoom-in, and slide-from-origin. Try opening the components above.
          </p>
        </Section>

        {/* Icons */}
        <Section id="Icons" title="Icons">
          <div className="flex flex-wrap gap-4">
            {[Home, Settings, Search, Bell, Plus, Trash2, Edit3, Copy, ChevronRight, Check, X, Info, CalendarIcon].map((Icon, i) => (
              <div key={i} className="flex h-10 w-10 items-center justify-center rounded-md" style={{ background: "var(--surface2)" }}>
                <Icon className="h-5 w-5" style={{ color: "var(--text)" }} />
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm" style={{ color: "var(--muted)" }}>
            Lucide React. Default 20px, inherits text color.
          </p>
        </Section>
      </main>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Reusable Sub-components                                            */
/* ------------------------------------------------------------------ */

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mb-16 scroll-mt-8">
      <h2 className="mb-6 text-xl font-semibold">{title}</h2>
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
        <p className="text-xs font-medium">{name}</p>
        <p className="text-[10px] font-mono" style={{ color: "var(--muted)" }}>{value}</p>
      </div>
    </div>
  );
}

function Btn({
  children,
  style = "primary",
  size = "default",
  icon,
  onClick,
  className,
}: {
  children: React.ReactNode;
  style?: "primary" | "secondary" | "outline" | "ghost" | "destructive" | "link";
  size?: "sm" | "default" | "lg";
  icon?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  const styles: Record<string, React.CSSProperties> = {
    primary: { background: "var(--primary)", color: "white" },
    secondary: { background: "var(--surface2)", color: "var(--text)", border: "1px solid var(--border)" },
    outline: { background: "transparent", color: "var(--text)", border: "1px solid var(--border)" },
    ghost: { background: "transparent", color: "var(--text)" },
    destructive: { background: "var(--danger)", color: "white" },
    link: { background: "transparent", color: "var(--primary)", textDecoration: "underline" },
  };

  const sizes: Record<string, string> = {
    sm: "h-8 px-3 text-xs",
    default: "h-9 px-4 text-sm",
    lg: "h-10 px-8 text-sm",
  };

  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 rounded-md font-medium shadow-sm transition-all active:scale-[0.99] ${icon ? "h-9 w-9 px-0" : sizes[size]} ${className || ""}`}
      style={styles[style]}
    >
      {children}
    </button>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className="h-9 w-full rounded-md border bg-transparent px-3 text-sm outline-none transition-all focus-visible:ring-2 focus-visible:ring-ring/50"
      style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" }}
      {...props}
    />
  );
}

function Card({ children, className, style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <div className={`rounded-xl border p-6 ${className || ""}`} style={{ background: "var(--surface)", borderColor: "var(--border)", ...style }}>
      {children}
    </div>
  );
}

function BadgeComp({ name, bg, text }: { name: string; bg: string; text: string }) {
  return (
    <span className="inline-flex items-center rounded px-2 py-0.5 text-xs font-medium" style={{ background: bg, color: text }}>
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

  const icons: Record<string, React.ReactNode> = {
    success: <Check className="h-4 w-4 shrink-0" style={{ color: "var(--primary)" }} />,
    warning: <AlertTriangle className="h-4 w-4 shrink-0" style={{ color: "var(--warning)" }} />,
    error: <X className="h-4 w-4 shrink-0" style={{ color: "var(--danger)" }} />,
    info: <Info className="h-4 w-4 shrink-0" style={{ color: "var(--info)" }} />,
  };

  return (
    <div className="flex max-w-sm items-center gap-3 rounded-lg border-l-[3px] p-3" style={{ background: "var(--surface)", borderColor: "var(--border)", borderLeftColor: borderColors[variant] }}>
      {icons[variant]}
      <p className="text-sm">{message}</p>
    </div>
  );
}

function SidebarItem({ title, meta, active = false }: { title: string; meta: string; active?: boolean }) {
  return (
    <div
      className="flex cursor-pointer flex-col gap-1 rounded-md px-3 py-2 transition-colors"
      style={{
        background: active ? "var(--surface2)" : "transparent",
        borderLeft: active ? "3px solid var(--primary)" : "3px solid transparent",
        paddingLeft: active ? "calc(0.75rem - 3px)" : "0.75rem",
      }}
    >
      <span className="text-sm font-medium">{title}</span>
      <span className="text-xs" style={{ color: "var(--muted)" }}>{meta}</span>
    </div>
  );
}

function MotionBox({ label, className }: { label: string; className?: string }) {
  return (
    <div
      className={`flex h-20 w-28 cursor-pointer items-center justify-center rounded-lg border text-xs font-medium ${className || ""}`}
      style={{ background: "var(--surface)", borderColor: "var(--border)" }}
    >
      {label}
    </div>
  );
}
