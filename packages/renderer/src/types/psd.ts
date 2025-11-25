export interface PsdMetadata {
  edited?: boolean;
}

export interface PsdVariant {
  path: string;
  extension: string;
}

export interface PsdGroup {
  baseName: string;
  directory: string;
  psd: PsdVariant;
  others: PsdVariant[];
  metadata: PsdMetadata;
}

