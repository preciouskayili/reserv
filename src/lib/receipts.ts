// Demo receipts stay in IndexedDB so full files do not exhaust localStorage.
function database(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("reserv-receipts", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("files");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
export async function saveReceipt(id: string, file: File) {
  if (!["image/jpeg", "image/png", "image/webp", "application/pdf"].includes(file.type) || file.size === 0 || file.size > 8 * 1024 * 1024) throw new Error("Choose a JPG, PNG, WebP, or PDF up to 8 MB.");
  const db = await database();
  try { await new Promise<void>((resolve, reject) => {
    const tx = db.transaction("files", "readwrite");
    tx.objectStore("files").put(file, id);
    tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error); tx.onabort = () => reject(tx.error);
  }); } finally { db.close(); }
}
export async function readReceipt(id: string): Promise<Blob | undefined> {
  const db = await database();
  try { return await new Promise<Blob | undefined>((resolve, reject) => {
    const request = db.transaction("files", "readonly").objectStore("files").get(id);
    request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error);
  }); } finally { db.close(); }
}
