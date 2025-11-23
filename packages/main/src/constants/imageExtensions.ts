export const STANDARD_IMAGE_EXTENSIONS = [
  "png",
  "jpg",
  "jpeg",
  "webp",
  "bmp",
  "gif",
  "tiff",
  "tif",
  "heic",
  "heif",
  "svg",
] as const;

export const PROFESSIONAL_IMAGE_EXTENSIONS = [
  "psd", // Adobe Photoshop
] as const;

export const RAW_IMAGE_EXTENSIONS = [
  "dng",
  "raw",
  "cr2",
  "cr3",
  "nef",
  "nrw",
  "arw",
  "sr2",
  "srf",
  "orf",
  "raf",
  "rw2",
  "rwl",
  "3fr",
  "fff",
  "mrw",
  "x3f",
  "erf",
  "kdc",
  "dcr",
  "dcs",
  "drf",
  "mef",
  "mos",
  "iiq",
  "rwz",
] as const;

export const ADDITIONAL_PRO_IMAGE_EXTENSIONS = [
  // 其他常见的 RAW/专业格式，可按需继续扩展
] as const;

export const ALL_IMAGE_EXTENSIONS = Array.from(
  new Set([
    ...STANDARD_IMAGE_EXTENSIONS,
    ...PROFESSIONAL_IMAGE_EXTENSIONS,
    ...RAW_IMAGE_EXTENSIONS,
    ...ADDITIONAL_PRO_IMAGE_EXTENSIONS,
  ])
);

export const IMAGE_EXTENSION_SET = new Set<string>(ALL_IMAGE_EXTENSIONS);
export const PROFESSIONAL_IMAGE_EXTENSION_SET = new Set<string>([
  ...PROFESSIONAL_IMAGE_EXTENSIONS,
]);
export const RAW_IMAGE_EXTENSION_SET = new Set<string>(RAW_IMAGE_EXTENSIONS);
export const NEEDS_CONVERSION_IMAGE_EXTENSION_SET = new Set<string>([
  ...PROFESSIONAL_IMAGE_EXTENSIONS,
  ...RAW_IMAGE_EXTENSIONS,
]);

export function isSupportedImageExtension(extension: string) {
  return IMAGE_EXTENSION_SET.has(extension.toLowerCase());
}
