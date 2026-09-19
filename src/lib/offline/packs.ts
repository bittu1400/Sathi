import { get, set, del, keys } from "idb-keyval";

export interface PackMeta {
  routeId: string;
  sizeBytes: number;
  downloadedAt: string;
}

export async function downloadPack(
  routeId: string,
  tilesUrl: string,
  totalBytes: number,
  onProgress?: (pct: number) => void
): Promise<Blob | null> {
  try {
    if (typeof window !== "undefined" && "storage" in navigator && navigator.storage.persist) {
      await navigator.storage.persist();
    }

    const response = await fetch(tilesUrl);
    if (!response.ok || !response.body) {
      throw new Error(`Failed to fetch tiles from ${tilesUrl}`);
    }

    const reader = response.body.getReader();
    let receivedBytes = 0;
    const chunks: Uint8Array[] = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        chunks.push(value);
        receivedBytes += value.length;
        if (onProgress && totalBytes > 0) {
          onProgress(Math.min(100, Math.round((receivedBytes / totalBytes) * 100)));
        }
      }
    }

    const blob = new Blob(chunks as BlobPart[], { type: "application/octet-stream" });
    await set(`pack:${routeId}`, blob);

    const meta: PackMeta = {
      routeId,
      sizeBytes: blob.size,
      downloadedAt: new Date().toISOString(),
    };
    await set(`packMeta:${routeId}`, meta);

    return blob;
  } catch (err) {
    console.error("Pack download failed:", err);
    return null;
  }
}

export async function getPack(routeId: string): Promise<Blob | undefined> {
  return get<Blob>(`pack:${routeId}`);
}

export async function deletePack(routeId: string): Promise<void> {
  await del(`pack:${routeId}`);
  await del(`packMeta:${routeId}`);
}

export async function listPacks(): Promise<PackMeta[]> {
  const allKeys = await keys();
  const packMetaKeys = allKeys.filter(
    (k) => typeof k === "string" && k.startsWith("packMeta:")
  );
  const metas: PackMeta[] = [];

  for (const k of packMetaKeys) {
    const meta = await get<PackMeta>(k);
    if (meta) metas.push(meta);
  }

  return metas;
}
