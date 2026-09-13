"use client";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { InlineError } from "@/components/feedback";
import { RouteLoading } from "@/components/page-loading";
import { useAuth } from "./auth-context";
import { normalizePayments } from "./payments";
import { type AppState } from "./model";
import { api, ApiError, getStoredWorkspaceId, setStoredWorkspaceId, type Snapshot } from "./api";
import type { OnboardingData } from "@/components/onboarding-modal";
export interface WorkspaceSummary { id: string; name: string; slug: string; role: string; }
export const emptyWorkspaceState: AppState = {
  business: {
    id: "",
    name: "Studio Workspace",
    slug: "studio",
    owner: "",
    category: "Studio",
    description: "",
    phone: "",
    address: "",
    hours: [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ].map((day, i) => ({
      day,
      open: "09:00",
      close: "17:00",
      closed: i > 4,
    })),
    bookingPolicy: "Please arrive a few minutes before your appointment.",
    cancellationPolicy: "Contact us if your plans change.",
    depositPolicy: "Payment instructions will be provided by the business.",
    faqs: [],
    rules: { minNoticeMinutes: 60, maxAdvanceDays: 30, slotMinutes: 15 },
  },
  staff: [],
  services: [],
  customers: [],
  bookings: [],
  payments: [],
  agentActivity: [],
  settings: { reminders: false, confirmations: false, owner: "" },
  loaded: false,
};

interface StoreContextType {
 state: AppState; update: (fn: (state: AppState) => AppState) => Promise<boolean>; reset: () => void;
 workspaces: WorkspaceSummary[]; activeWorkspaceId: string | null;
 switchWorkspace: (id: string) => Promise<void>; createWorkspace: (data: OnboardingData) => Promise<void>;
 needsOnboarding: boolean; setNeedsOnboarding: (value: boolean) => void; isLoading: boolean;
 refresh: () => Promise<void>; acceptSnapshot: (snapshot: Snapshot) => void;
}
const Store=createContext<StoreContextType|null>(null);
export function StoreProvider({children}:{children:ReactNode}) {
 const pathname=usePathname(); const {user}=useAuth();
 const publicPath=/^\/(b|r|pay)\//.test(pathname);
 const scope=publicPath ? pathname : pathname==="/login" || pathname==="/reservation" ? pathname : `workspace:${user?.id ?? "guest"}`;
 return <ScopedStore key={scope} pathname={pathname} publicPath={publicPath}>{children}</ScopedStore>;
}
function ScopedStore({children,pathname,publicPath}:{children:ReactNode;pathname:string;publicPath:boolean}) {
 const {user}=useAuth(); const queryClient=useQueryClient();
 const [snapshot,setSnapshot]=useState<Snapshot|null>(null);
 const snapshotRef=useRef<Snapshot|null>(null); const epoch=useRef(0); const mounted=useRef(true);
 const [workspaces,setWorkspaces]=useState<WorkspaceSummary[]>([]);
 const [activeWorkspaceId,setActiveWorkspaceId]=useState<string|null>(null); const activeRef=useRef<string|null>(null);
 const [needsOnboarding,setNeedsOnboarding]=useState(false); const [isLoading,setIsLoading]=useState(true);
 const [error,setError]=useState(""); const [notFound,setNotFound]=useState(false); const [saving,setSaving]=useState(false);
 const queue=useRef<Promise<unknown>>(Promise.resolve()); const saveCount=useRef(0);
 const [reload,setReload]=useState(0);
 const bypass=pathname==="/login" || pathname==="/reservation" || !publicPath && !user;
 function acceptSnapshot(value:Snapshot) { snapshotRef.current=value;setSnapshot(value); }
 async function fetchPublic() { const [,kind,key]=pathname.split("/");return kind==="b" ? api.public.getBusiness(decodeURIComponent(key)) : api.public.getReservation(decodeURIComponent(key).toUpperCase()); }
 useEffect(()=>{
   mounted.current=true; let alive=true;
   async function load() {
     if(bypass){setIsLoading(false);return;}
     try {
       if(publicPath) { const result=await fetchPublic();if(alive)acceptSnapshot(result); }
       else {
         const {workspaces:list}=await api.workspaces.list();if(!alive)return;
         setWorkspaces(list);setNeedsOnboarding(list.length===0);
         if(list.length){const selected=list.find(w=>w.id===getStoredWorkspaceId())??list[0];
           const result=await api.workspaces.getState(selected.id);if(!alive)return;
           activeRef.current=selected.id;setActiveWorkspaceId(selected.id);setStoredWorkspaceId(selected.id);acceptSnapshot(result);
         }
       }
     } catch(err){if(alive){setNotFound(err instanceof ApiError && err.status===404);setError(err instanceof Error?err.message:"Couldn’t load this workspace.");}}
     finally{if(alive)setIsLoading(false);}
   }
   void load();return()=>{alive=false;mounted.current=false;};
   // The parent keys this component by account/public route; reload is explicit.
   // eslint-disable-next-line react-hooks/exhaustive-deps
 },[reload]);
 async function refresh(){const result=publicPath?await fetchPublic():await api.workspaces.getState(activeRef.current!);if(mounted.current)acceptSnapshot(result);}
 async function switchWorkspace(id:string){
   if(!workspaces.some(w=>w.id===id)||id===activeRef.current)return;
   if(saveCount.current){toast.info("Please wait for your changes to finish saving.");return;}
   const generation=++epoch.current;setIsLoading(true);setError("");snapshotRef.current=null;setSnapshot(null);queryClient.clear();
   try{const result=await api.workspaces.getState(id);if(generation!==epoch.current)return;activeRef.current=id;setActiveWorkspaceId(id);setStoredWorkspaceId(id);acceptSnapshot(result);}
   catch(err){setError(err instanceof Error?err.message:"Couldn’t switch workspace.");}
   finally{setIsLoading(false);}
 }
 async function createWorkspace(data:OnboardingData){
   if(saveCount.current)throw new Error("Wait for pending changes to finish before creating a workspace.");
   const result=await api.workspaces.create(data);epoch.current++;queryClient.clear();
   const id=result.state.business.id;activeRef.current=id;setActiveWorkspaceId(id);setStoredWorkspaceId(id);acceptSnapshot(result);setNeedsOnboarding(false);
   setWorkspaces(list=>[...list,{id,name:result.state.business.name,slug:result.state.business.slug,role:"owner"}]);toast.success("Your workspace is ready.");
 }
 function update(fn:(state:AppState)=>AppState):Promise<boolean>{
   const generation=epoch.current;const id=activeRef.current;saveCount.current++;setSaving(true);
   const task=queue.current.then(async()=>{
     if(!mounted.current||generation!==epoch.current||!snapshotRef.current)return false;
     const previous=snapshotRef.current;const next=normalizePayments(fn(previous.state));
     try{
       let result:Snapshot;
       if(publicPath){
         const booking=previous.state.bookings[0], changed=next.bookings.find(b=>b.id===booking?.id);
         if(!booking||!changed)throw new Error("This change isn’t available from a public booking page.");
         const action=changed.status==="Cancelled"?{action:"cancel" as const}:{action:"reschedule" as const,staffId:changed.staffId,startTime:changed.startTime};
         result=await api.public.changeReservation(booking.code,action);
       } else { if(!id)throw new Error("Choose a workspace first."); result=await api.workspaces.saveState(id,previous.revision,next); }
       if(mounted.current&&generation===epoch.current){acceptSnapshot(result);setWorkspaces(list=>list.map(w=>w.id===id?{...w,name:result.state.business.name,slug:result.state.business.slug}:w));}
       return true;
     }catch(err){if(mounted.current){toast.error(err instanceof Error?err.message:"Your changes were not saved.");if(err instanceof ApiError&&err.status===409){try{await refresh();}catch{setError("Couldn’t reload your workspace. Please try again.");}}}return false;}
   }).finally(()=>{saveCount.current--;if(mounted.current)setSaving(saveCount.current>0);});
   queue.current=task;return task;
 }
 const state=snapshot?normalizePayments(snapshot.state):{...emptyWorkspaceState,loaded:!isLoading};
 let content=children;
 if(!bypass&&isLoading)content=<RouteLoading pathname={pathname} withShell={!publicPath} />;
 else if(error)content=<main className="mx-auto max-w-2xl px-5 py-16"><InlineError title={notFound?"We couldn’t find that page.":"Couldn’t load your workspace."} message={error} onRetry={notFound?undefined:()=>{setError("");setIsLoading(true);setReload(value=>value+1);}} /><Link href="/reservation" className="mt-5 inline-flex text-sm text-primary">Find a reservation</Link></main>;
 return <Store.Provider value={{state,update,reset:()=>void refresh(),workspaces,activeWorkspaceId,switchWorkspace,createWorkspace,needsOnboarding,setNeedsOnboarding,isLoading,refresh,acceptSnapshot}}>{saving&&<div role="status" className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-full bg-primary px-4 py-2 text-xs text-white shadow-sm">Saving changes…</div>}{content}</Store.Provider>;
}
export function useStore(){const value=useContext(Store);if(!value)throw new Error("StoreProvider is required");return value;}
