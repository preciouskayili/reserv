import type { Metadata } from "next";
import { Figtree } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";
import { StoreProvider } from "@/lib/store";

const figtree = Figtree({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Reserv — A little more room in your day",
  description:
    "A calm home for your appointments. Manage your studio, welcome your customers, and make room for what you do best.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${figtree.className} h-full antialiased font-sans`}
    >
      <body className="min-h-full flex flex-col">
        <TooltipProvider>
          <StoreProvider>{children}</StoreProvider>
        </TooltipProvider>
        <Toaster theme="light" position="bottom-right" />
      </body>
    </html>
  );
}
