import { onBeforeUnmount, reactive } from "vue";

type CacheStore = Record<string, string | undefined>;

type ThumbnailCacheOptions = {
  maxEntries?: number;
  targetSize?: number;
  mimeType?: string;
  quality?: number;
};

const DEFAULT_OPTIONS: Required<ThumbnailCacheOptions> = {
  maxEntries: 400,
  targetSize: 256,
  mimeType: "image/webp",
  quality: 0.92,
};

export function useThumbnailCache(options: ThumbnailCacheOptions = {}) {
  const { maxEntries, targetSize, mimeType, quality } = {
    ...DEFAULT_OPTIONS,
    ...options,
  };

  const store = reactive<CacheStore>({});
  const inflight = new Map<string, Promise<void>>();
  const order: string[] = [];

  function set(resource: string, url: string) {
    if (!store[resource]) {
      order.push(resource);
    }
    store[resource] = url;
    shrink();
  }

  function shrink() {
    while (order.length > maxEntries) {
      const oldest = order.shift();
      if (!oldest) break;
      release(oldest);
    }
  }

  async function generateThumbnail(resource: string) {
    const response = await fetch(resource);
    const blob = await response.blob();
    if (typeof createImageBitmap !== "function") {
      return blob;
    }

    const bitmap = await createImageBitmap(blob);
    try {
      const longest = Math.max(bitmap.width, bitmap.height);
      const scale = longest > targetSize ? targetSize / longest : 1;
      const width = Math.max(1, Math.round(bitmap.width * scale));
      const height = Math.max(1, Math.round(bitmap.height * scale));

      const canvas =
        typeof OffscreenCanvas !== "undefined"
          ? new OffscreenCanvas(width, height)
          : Object.assign(document.createElement("canvas"), {
              width,
              height,
            });

      const ctx = canvas.getContext("2d");
      if (!ctx) return blob;
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(bitmap, 0, 0, width, height);

      if ("convertToBlob" in canvas) {
        return await (canvas as OffscreenCanvas).convertToBlob({
          type: mimeType,
          quality,
        });
      }

      return await new Promise<Blob>((resolve, reject) => {
        (canvas as HTMLCanvasElement).toBlob(
          (result) => {
            if (result) resolve(result);
            else reject(new Error("Canvas toBlob returned null"));
          },
          mimeType,
          quality
        );
      });
    } catch (error) {
      console.warn("[ThumbnailCache] failed to generate bitmap", error);
      return blob;
    } finally {
      bitmap.close();
    }
  }

  function prefetch(resource: string) {
    if (!resource || store[resource] || inflight.has(resource)) return;
    const request = generateThumbnail(resource)
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        set(resource, url);
      })
      .catch((error) => {
        console.warn("[ThumbnailCache] Failed to fetch resource", resource, error);
      })
      .finally(() => {
        inflight.delete(resource);
      });
    inflight.set(resource, request);
  }

  function prefetchMany(resources: string[]) {
    resources.forEach(prefetch);
  }

  function get(resource: string) {
    return store[resource];
  }

  function isReady(resource: string) {
    return !!store[resource];
  }

  function release(resource: string) {
    const url = store[resource];
    if (url) {
      URL.revokeObjectURL(url);
      delete store[resource];
    }
    const index = order.indexOf(resource);
    if (index >= 0) {
      order.splice(index, 1);
    }
  }

  function retain(resources: string[]) {
    const keep = new Set(resources);
    Object.keys(store).forEach((resource) => {
      if (!keep.has(resource)) {
        release(resource);
      }
    });
  }

  function clear() {
    Object.entries(store).forEach(([resource, url]) => {
      if (url) {
        URL.revokeObjectURL(url);
      }
      delete store[resource];
    });
    order.splice(0, order.length);
    inflight.clear();
  }

  onBeforeUnmount(() => {
    clear();
  });

  return {
    prefetch,
    prefetchMany,
    get,
    isReady,
    retain,
    clear,
  };
}
