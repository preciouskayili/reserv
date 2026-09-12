import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";
import { StoreProvider } from "@/lib/reserv/store";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Reserv — A little more room in your day",
  description:
    "A calm home for your appointments. Manage your studio, welcome your customers, and make room for what you do best.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased font-sans`}>
      <body className="min-h-full flex flex-col">
        <TooltipProvider>
          <StoreProvider>{children}</StoreProvider>
        </TooltipProvider>
        <Toaster theme="light" position="bottom-right" />
      </body>
    </html>
  );
}
