"use client";
import { useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { createActionLock } from "@/lib/action-lock";

export function useWorkspaceSave() {
  const store = useStore();
  const [isSaving, setIsSaving] = useState(false);
  const [lock] = useState(createActionLock);
  const active = useRef(false);
  const update: typeof store.update = (change) => lock.run(async () => {
    active.current = true;
    setIsSaving(true);
    try { return await store.update(change); }
    finally { active.current = false; setIsSaving(false); }
  });
  return { ...store, update, isSaving, canDismiss: () => !active.current };
}
