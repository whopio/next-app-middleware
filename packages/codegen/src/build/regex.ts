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

const make = (regex: RegExp) => ({
  regex,
  find: makeFind(regex),
});

export const { regex: middlewareRegex, find: findMiddleware } = make(
  /^(middleware\.(?:t|j)s)$/
);

export const { regex: pageRegex, find: findPage } = make(
  /^(page\.(?:tsx|jsx?))$/
);

export const { regex: routeRegex, find: findRoute } = make(
  /^(route\.(?:ts|js?))$/
);

export const { regex: externalRegex, find: findExternal } = make(
  /^(external\.(?:t|j)s)$/
);

export const { regex: dynamicForwardRegex, find: findDynamicForward } = make(
  /^(forward\.dynamic\.(?:t|j)s)$/
);

export const { regex: staticForwardRegex, find: findStaticForward } = make(
  /^(forward\.static\.(?:t|j)s)$/
);

export const { regex: rewriteRegex, find: findRewrite } = make(
  /^(rewrite\.(?:t|j)s)$/
);

export const { regex: redirectRegex, find: findRedirect } = make(
  /^(redirect\.(?:t|j)s)$/
);
