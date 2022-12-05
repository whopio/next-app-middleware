export type SegmentHashes = {
  middleware: string;
  rewrite: Record<string, string>;
};

export type SegmentLayout = {
  rewrite: string[];
  page: boolean;
  middleware: boolean;
  location: string;
  internalPath: string;
  externalPath: string;
  hash: string;
  dynamic?: string;
  hashes: SegmentHashes;
  children: Record<string, SegmentLayout>;
  parent?: () => SegmentLayout;
};

export type ExternalLayout = Record<string, SegmentLayout[]>;
