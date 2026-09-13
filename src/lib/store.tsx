"use client";
import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useRef,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { PageLoading } from "@/components/feedback";
import { normalizePayments } from "./payments";
import { seed } from "./seed";
import { type AppState } from "./model";
const STORAGE_KEY = "reserv-demo-v1";
type Action =
  | { type: "load"; state: AppState }
  | { type: "update"; update: (state: AppState) => AppState }
  | { type: "reset" };
function reducer(state: AppState, action: Action): AppState {
  if (action.type === "load") return normalizePayments({ ...action.state, loaded: true });
  if (action.type === "reset") return normalizePayments({ ...seed, loaded: true });
  return normalizePayments(action.update(state));
}
const Store = createContext<{
  state: AppState;
  update: (fn: (state: AppState) => AppState) => void;
  reset: () => void;
} | null>(null);
export function StoreProvider({ children }: { children: ReactNode }) {
  const storageWarning = useRef(false);
  const [state, dispatch] = useReducer(reducer, seed, normalizePayments);
  useEffect(() => {
    let initial = seed;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (
          parsed.business?.id === "bloom" &&
          Array.isArray(parsed.bookings) &&
          Array.isArray(parsed.services) &&
          Array.isArray(parsed.customers) &&
          parsed.settings
        )
          initial = parsed;
      }
    } catch {
      /* Storage is optional for the local demo. */
    }
    dispatch({ type: "load", state: initial });
  }, []);
  useEffect(() => {
    if (state.loaded) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch {
        if (!storageWarning.current) {
          storageWarning.current = true;
          toast.warning("Changes are only available in this session. Browser storage is full or unavailable.");
        }
      }
    }
  }, [state]);
  return (
    <Store.Provider
      value={{
        state,
        update: (update) => dispatch({ type: "update", update }),
        reset: () => dispatch({ type: "reset" }),
      }}
    >
      {state.loaded ? children : <PageLoading />}
    </Store.Provider>
  );
}
export function useStore() {
  const store = useContext(Store);
  if (!store) throw new Error("StoreProvider is required");
  return store;
}
