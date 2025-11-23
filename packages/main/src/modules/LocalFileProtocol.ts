import { protocol, nativeImage } from "electron";
import { AppModule } from "../AppModule.js";
import { extname } from "node:path";
import { readFile, stat } from "node:fs/promises";
import {
  NEEDS_CONVERSION_IMAGE_EXTENSION_SET,
  RAW_IMAGE_EXTENSION_SET,
} from "../constants/imageExtensions.js";

export const LOCAL_FILE_PROTOCOL_SCHEME = "photon-file";

const MAX_CONVERTED_EDGE = 4096;
const CONVERSION_CACHE_LIMIT = 40;

type ConversionCacheEntry = {
  data: Buffer;
  mimeType: string;
  mtimeMs: number;
};

const conversionCache = new Map<string, ConversionCacheEntry>();

protocol.registerSchemesAsPrivileged([
  {
    scheme: LOCAL_FILE_PROTOCOL_SCHEME,
    privileges: {
      secure: true,
      standard: true,
      supportFetchAPI: true,
      corsEnabled: true,
      stream: true,
    },
  },
]);

function parseFilePath(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const encodedPath = urlObj.searchParams.get("path");
    if (encodedPath) {
      return decodeURIComponent(encodedPath);
    }
    return null;
  } catch (error) {
    console.error("解析 URL 失败:", error);
    return null;
  }
}

function getMimeTypeForStandardExtension(extension: string) {
  const mimeTypes: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
    bmp: "image/bmp",
    tiff: "image/tiff",
    tif: "image/tiff",
    svg: "image/svg+xml",
    heic: "image/heic",
    heif: "image/heif",
  };
  return mimeTypes[extension] || "application/octet-stream";
}

function trimConversionCache() {
  while (conversionCache.size > CONVERSION_CACHE_LIMIT) {
    const oldest = conversionCache.keys().next().value;
    if (!oldest) break;
    conversionCache.delete(oldest);
  }
}

async function convertUsingSharp(filePath: string) {
  const sharp = await import("sharp");
  const options = { failOn: "none" as const, limitInputPixels: 268435456 };
  const metadata = await sharp.default(filePath, options).metadata();
  const target = sharp
    .default(filePath, options)
    .rotate()
    .resize(MAX_CONVERTED_EDGE, MAX_CONVERTED_EDGE, {
      fit: "inside",
      withoutEnlargement: true,
    });

  if (metadata.hasAlpha) {
    const pngBuffer = await target.png({ compressionLevel: 8 }).toBuffer();
    return { data: pngBuffer, mimeType: "image/png" as const };
  }

  const jpegBuffer = await target
    .jpeg({ quality: 92, chromaSubsampling: "4:4:4" })
    .toBuffer();
  return { data: jpegBuffer, mimeType: "image/jpeg" as const };
}

async function convertUsingNativeImage(filePath: string) {
  const image = nativeImage.createFromPath(filePath);
  if (image.isEmpty()) {
    throw new Error(`nativeImage 无法解析: ${filePath}`);
  }
  return { data: image.toPNG(), mimeType: "image/png" as const };
}

async function extractEmbeddedJpegPreview(filePath: string) {
  const buffer = await readFile(filePath);
  const startMarker = Buffer.from([0xff, 0xd8]);
  const endMarker = Buffer.from([0xff, 0xd9]);
  let cursor = 0;
  let best: Buffer | null = null;
  while (cursor < buffer.length) {
    const start = buffer.indexOf(startMarker, cursor);
    if (start < 0) break;
    const end = buffer.indexOf(endMarker, start + 2);
    if (end < 0) break;
    const candidate = buffer.slice(start, end + 2);
    if (!best || candidate.length > best.length) {
      best = candidate;
    }
    cursor = end + 2;
  }
  if (!best || best.length < 4096) {
    return null;
  }
  return { data: best, mimeType: "image/jpeg" as const };
}

async function getConvertedImage(filePath: string, ext: string) {
  const stats = await stat(filePath);
  const cached = conversionCache.get(filePath);
  if (cached && cached.mtimeMs === stats.mtimeMs) {
    return cached;
  }

  try {
    const converted = await convertUsingSharp(filePath);
    const entry: ConversionCacheEntry = {
      ...converted,
      mtimeMs: stats.mtimeMs,
    };
    conversionCache.set(filePath, entry);
    trimConversionCache();
    return entry;
  } catch (error) {
    console.warn(`[LocalFileProtocol] sharp 处理失败(${ext})`, error);
  }

  if (RAW_IMAGE_EXTENSION_SET.has(ext)) {
    try {
      const preview = await extractEmbeddedJpegPreview(filePath);
      if (preview) {
        const entry: ConversionCacheEntry = {
          ...preview,
          mtimeMs: stats.mtimeMs,
        };
        conversionCache.set(filePath, entry);
        trimConversionCache();
        return entry;
      }
    } catch (error) {
      console.warn(`[LocalFileProtocol] 提取嵌入预览失败(${ext})`, error);
    }
  }

  const fallback = await convertUsingNativeImage(filePath);
  const entry: ConversionCacheEntry = { ...fallback, mtimeMs: stats.mtimeMs };
  conversionCache.set(filePath, entry);
  trimConversionCache();
  return entry;
}

export function createLocalFileProtocolModule(): AppModule {
  return {
    async enable({ app }) {
      await app.whenReady();

      protocol.registerBufferProtocol(
        LOCAL_FILE_PROTOCOL_SCHEME,
        async (request, callback) => {
          const filePath = parseFilePath(request.url);
          if (!filePath) {
            callback({ error: -6 });
            return;
          }

          const ext = extname(filePath).slice(1).toLowerCase();

          // 如果是需要转换的格式
          if (NEEDS_CONVERSION_IMAGE_EXTENSION_SET.has(ext)) {
            try {
              const converted = await getConvertedImage(filePath, ext);
              callback({
                mimeType: converted.mimeType,
                data: converted.data,
              });
              return;
            } catch (error) {
              console.error(`[LocalFileProtocol] 转换格式失败(${ext})`, error);
              callback({ error: -6 });
              return;
            }
          }

          // 对于普通格式，读取文件内容返回
          try {
            const fileBuffer = await readFile(filePath);
            callback({
              mimeType: getMimeTypeForStandardExtension(ext),
              data: fileBuffer,
            });
          } catch (error) {
            console.error("读取文件失败:", error);
            callback({ error: -6 });
          }
        }
      );

    },
  };
}
