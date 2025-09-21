import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from "@/components/ui/toast";

// Removed remote Google font fetch (Geist) due to build-time network failures.
// Provide CSS variables manually with system font fallbacks.
const fontVars = "[--font-geist-sans:system-ui,_-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,'Noto Sans',sans-serif] [--font-geist-mono:ui-monospace,'SFMono-Regular','SF Mono',Menlo,Consolas,'Liberation Mono',monospace]";

export const metadata: Metadata = {
  title: "DataBotix",
  description: "AI Copilot for Data Teams",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
  <body className={`${fontVars} antialiased`}>
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
