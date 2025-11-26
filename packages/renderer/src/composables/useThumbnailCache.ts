import { onBeforeUnmount, reactive, ref } from "vue";

type CacheStore = Record<string, string | undefined>;

type ThumbnailCacheOptions = {
  maxEntries?: number;
  targetSize?: number;
  mimeType?: string;
  quality?: number;
  maxInflight?: number;
};

const DEFAULT_OPTIONS: Required<Omit<ThumbnailCacheOptions, "maxInflight">> = {
  maxEntries: 400,
  targetSize: 256,
  mimeType: "image/webp",
  quality: 0.92,
};

const DEFAULT_MAX_INFLIGHT = 8;

export function useThumbnailCache(options: ThumbnailCacheOptions = {}) {
  const { maxEntries, targetSize, mimeType, quality } = {
    ...DEFAULT_OPTIONS,
    ...options,
  };

  const maxInflight = ref(
    typeof options.maxInflight === "number"
      ? Math.max(1, options.maxInflight | 0)
      : DEFAULT_MAX_INFLIGHT
  );

  const store = reactive<CacheStore>({});
  const inflight = new Map<string, Promise<void>>();
  const order: string[] = [];
  const queue: string[] = [];
  const queued = new Set<string>();

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

  function drainQueue() {
    while (inflight.size < maxInflight.value && queue.length > 0) {
      const resource = queue.shift();
      if (!resource) {
        continue;
      }
      queued.delete(resource);
      if (!resource || store[resource] || inflight.has(resource)) {
        continue;
      }

      const request = generateThumbnail(resource)
        .then((blob) => {
          const url = URL.createObjectURL(blob);
          set(resource, url);
        })
        .catch((error) => {
          console.warn(
            "[ThumbnailCache] Failed to fetch resource",
            resource,
            error
          );
        })
        .finally(() => {
          inflight.delete(resource);
          drainQueue();
        });

      inflight.set(resource, request);
    }
  }

  function prefetch(resource: string) {
    if (
      !resource ||
      store[resource] ||
      inflight.has(resource) ||
      queued.has(resource)
    ) {
      return;
    }
    queued.add(resource);
    queue.push(resource);
    drainQueue();
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
    queue.splice(0, queue.length);
    queued.clear();
    inflight.clear();
  }

  function setMaxInflight(next: number) {
    const normalized = Math.max(1, next | 0);
    if (normalized === maxInflight.value) return;
    maxInflight.value = normalized;
    drainQueue();
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
    setMaxInflight,
  };
}
