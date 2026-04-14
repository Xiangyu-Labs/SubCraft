import "./globals.css";
import { Providers } from "@/components/providers";

export const metadata = {
  title: "{{PROJECT_NAME}}",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
