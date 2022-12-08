export type SegmentHashes = {
  middleware: string | false;
  rewrite: Record<string, string>;
};

export type SegmentFiles = {
  page?: string;
  middleware?: string;
  rewrite?: string;
};

export type LayoutType<T> = [
  T,
  LayoutType<T> | 1 | undefined,
  LayoutType<T> | 1 | undefined
];

export type SegmentLayout = {
  rewrite: string[];
  page: boolean;
  middleware: boolean;
  location: string;
  segment: string;
  group: boolean;
  internalPath: string;
  externalPath: string;
  hash: string;
  dynamic?: string;
  hashes: SegmentHashes;
  children: Record<string, SegmentLayout>;
  files: SegmentFiles;
  parent?: () => SegmentLayout;
};

export type ExternalLayout = Record<string, SegmentLayout[]>;
