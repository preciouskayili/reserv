import { request, type Snapshot } from "./api";
export async function saveReceipt(code:string,file:File,amount:number):Promise<Snapshot> {
 const body=new FormData();body.append("file",file);body.append("amount",String(amount));
 return request<Snapshot>(`/api/receipts/reservation/${encodeURIComponent(code)}`,{method:"POST",body});
}
export async function readReceipt(id:string):Promise<Blob> {
 const {url}=await request<{url:string}>(`/api/receipts/${encodeURIComponent(id)}`);
 const response=await fetch(url,{signal:AbortSignal.timeout(15000)});if(!response.ok)throw new Error("Receipt download failed");return response.blob();
}
