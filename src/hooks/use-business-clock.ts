"use client";

import { useEffect, useState } from "react";
import { businessNow } from "@/lib/model";

export function useBusinessClock() {
  const [now, setNow] = useState(businessNow);
  useEffect(() => {
    const update = () => setNow(businessNow());
    const timer = setInterval(update, 30000);
    window.addEventListener("focus", update);
    document.addEventListener("visibilitychange", update);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", update);
      document.removeEventListener("visibilitychange", update);
    };
  }, []);
  return { NOW: now, TODAY: now.slice(0, 10) };
}
