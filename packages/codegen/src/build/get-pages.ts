import { SegmentLayout } from "../types";

const getPages = (layout: SegmentLayout): SegmentLayout[] => {
  const result: SegmentLayout[] = [];
  // pages, redirects and rewrites are considered endpoints
  if (layout.page || layout.redirect || layout.rewrite) result.push(layout);
  for (const child of Object.values(layout.children)) {
    result.push(...getPages(child));
  }
  return result;
};

export default getPages;

export const getSimilarPages = (pages: SegmentLayout[]) => {
  const result: Record<string, SegmentLayout[]> = {};
  for (const page of pages) {
    if (!result[page.hash]) result[page.hash] = [page];
    else result[page.hash].push(page);
  }
  return result;
};
