"use client";
import { ThemeProvider as NextThemeProvider, useTheme } from "next-themes";
import type { ReactNode } from "react";
import { useSyncExternalStore } from "react";
const subscribe = () => () => {};
export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemeProvider>
  );
}
export function ThemeSelect() {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  return (
    <select
      aria-label="Appearance"
      value={mounted ? theme : "system"}
      onChange={(e) => setTheme(e.target.value)}
      className="min-h-9 rounded-lg bg-muted px-3 text-xs font-medium text-foreground"
    >
      <option value="system">System</option>
      <option value="light">Light</option>
      <option value="dark">Dark</option>
    </select>
  );
}
