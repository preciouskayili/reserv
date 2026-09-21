import { ThemeProvider } from "@/components/theme-provider";
import type { Metadata } from "next";
import { Figtree } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";
import { StoreProvider } from "@/lib/store";
import { QueryProvider } from "@/components/query-provider";
import { AuthProvider } from "@/lib/auth-context";

const figtree = Figtree({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Reserv — Booking and workspace management",
  description:
    "Manage appointments, customers, payments, and automated calls for your business.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html suppressHydrationWarning lang="en" className={`${figtree.className} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
        <QueryProvider>
          <AuthProvider>
            <TooltipProvider>
              <StoreProvider>{children}</StoreProvider>
            </TooltipProvider>
          </AuthProvider>
        </QueryProvider>
        <Toaster position="bottom-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
