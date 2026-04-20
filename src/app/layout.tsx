import "./globals.css";
import { ThemeSwitcher } from "@/components/theme-switcher";

const foucScript = `
  (function() {
    var theme = localStorage.getItem("app-theme") || "modern";
    var dark = localStorage.getItem("app-dark-mode");
    document.documentElement.setAttribute("data-theme", theme);
    if (dark === "true" || (dark === null && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
      document.documentElement.classList.add("dark");
    }
  })();
`;

export const metadata = {
  title: "SubCraft - Vless to Clash Converter",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh" data-scroll-behavior="smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
        <script dangerouslySetInnerHTML={{ __html: foucScript }} />
      </head>
      <body>
        {/* Global Theme Bar — 右下角浮动，避免遮挡 header 按钮 */}
        <div
          className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-lg border px-3 py-2 shadow-lg"
          style={{
            background: "var(--surface)",
            borderColor: "var(--border)",
          }}
        >
          <ThemeSwitcher />
        </div>
        {children}
      </body>
    </html>
  );
}
