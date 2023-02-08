export const dynamicSegmentRegex = /\[((?!\.\.\.).*)\]/;
export const isDynamicSegment = (segment: string) =>
  dynamicSegmentRegex.test(segment);

export const catchAllSegmentRegex = /\[\.\.\.(.*)\]/;
export const isCatchAllSegment = (segment: string) =>
  catchAllSegmentRegex.test(segment);

export const routeGroupSegmentRegex = /\((.*)\)/;
export const isRouteGroupSegment = (segment: string) =>
  routeGroupSegmentRegex.test(segment);

export const makeFind = (regex: RegExp) => (filesAndFolders: string[]) =>
  filesAndFolders.find((fileOrfolder) => regex.test(fileOrfolder));

export const middlewareRegex = /^(middleware\.(?:t|j)s)$/;
export const findMiddleware = makeFind(middlewareRegex);

export const pageRegex = /^(page\.(?:tsx|jsx?))$/;
export const findPage = makeFind(pageRegex);

export const externalRegex = /^(external\.(?:t|j)s)$/;
export const findExternal = makeFind(externalRegex);

export const forwardRegex = /^(forward\.(?:t|j)s)$/;
export const findForward = makeFind(forwardRegex);

export const rewriteRegex = /^(rewrite\.(?:t|j)s)$/;
export const findRewrite = makeFind(rewriteRegex);

export const redirectRegex = /^(redirect\.(?:t|j)s)$/;
export const findRedirect = makeFind(redirectRegex);
