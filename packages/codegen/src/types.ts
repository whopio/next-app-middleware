export type LayoutType<T> = [
  T,
  LayoutType<T> | 1 | undefined,
  LayoutType<T> | 1 | undefined
];

export type SegmentLayout = {
  forward: string[];
  rewrite: boolean;
  redirect: boolean;
  page: boolean;
  middleware: boolean;
  location: string;
  segment: string;
  group: boolean;
  internalPath: string;
  externalPath: string;
  hash: string;
  dynamic?: string;
  children: Record<string, SegmentLayout>;
  parent?: () => SegmentLayout;
};

export type ExternalLayout = Record<string, SegmentLayout[]>;
