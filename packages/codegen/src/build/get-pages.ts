import { SegmentLayout } from "../types";

/**
 * @returns A list of `SegmentLayout` that are externally accessible endpoints
 */
const getPages = (layout: SegmentLayout): SegmentLayout[] => {
  const result: SegmentLayout[] = [];
  // pages, externals, redirects and rewrites are considered endpoints
  if (layout.page || layout.external || layout.redirect || layout.rewrite)
    result.push(layout);
  for (const child of Object.values(layout.children)) {
    result.push(...getPages(child));
  }
  return result;
};

export const getRoutes = (layout: SegmentLayout) => {
  const result: string[] = [];
  // pages, externals, redirects and rewrites are considered endpoints
  if (layout.route)
    result.push(
      layout.internalPath
        .split("/")
        .map((part) =>
          part.startsWith(":") ? ":" : part.startsWith("*") ? "*" : part
        )
        .join("/")
    );
  for (const child of Object.values(layout.children)) {
    result.push(...getRoutes(child));
  }
  return result;
};

export default getPages;

/**
 * @returns A mapping of external routes to all possible `SegmentLayout` that
 * match that route
 */
export const getSimilarPages = (pages: SegmentLayout[]) => {
  const result: Record<string, SegmentLayout[]> = {};
  for (const page of pages) {
    if (!result[page.hash]) result[page.hash] = [page];
    else result[page.hash].push(page);
  }
  return result;
};
