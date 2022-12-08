import { LayoutType } from "../types";

export type RenderSegmentImportArgs = [
  string,
  string,
  string,
  "middleware" | "rewrite",
  string?
];

export const renderSegmentImport = (args: RenderSegmentImportArgs) =>
  args[3] === "middleware"
    ? renderMiddlewareSegmentImport(args)
    : renderForwarderSegmentImport(args);

export const renderForwarderSegmentImport = ([
  hash,
  location,
  internalPath,
  ,
  rewrite,
]: RenderSegmentImportArgs) => `const segment_${hash} = importForwarder(
  "${internalPath}",
  "${rewrite}",
  () => import("./${location}/rewrite")
);`;

export const renderMiddlewareSegmentImport = ([
  hash,
  location,
  internalPath,
]: RenderSegmentImportArgs) => `const segment_${hash} = importMiddleware(
  "${internalPath}",
  () => import("./${location}/middleware")
);`;

const renderDynamicImports = (
  imported: Record<string, RenderSegmentImportArgs>
) =>
  `
${Object.values(imported).map(renderSegmentImport).join("\n")}
`.trim();

export const staticImportsHeader = (
  hasMiddleware: boolean,
  hasRewrite: boolean
) => `import {
${[
  "makeMiddleware",
  hasRewrite && "importForwarder",
  hasMiddleware && "importMiddleware",
  "type MiddlewareLayout",
]
  .filter(Boolean)
  .map((item) => "  " + item)
  .join(",\n")},
} from "middleware-next/runtime";`;

export const staticExportsFooter = `export default makeMiddleware(layout);`;

export const renderLayout = (layouts: [string, LayoutType<string>][]) =>
  `
const layout: MiddlewareLayout = [
${layouts.map((layout) => renderRoute(...layout)).join("\n")}
];
`.trim();

export const renderRoute = (key: string, layout: LayoutType<string>) =>
  `
  ["${key}", ${renderRouteSegment(layout)}],
`.trim();

const renderRouteSegment = ([
  current,
  next,
  rewrite,
]: LayoutType<string>): string =>
  `
[${current},${
    typeof next === "number" ? next : next ? renderRouteSegment(next) : ""
  },${
    typeof rewrite === "number"
      ? rewrite
      : rewrite
      ? renderRouteSegment(rewrite)
      : ""
  }]
`.trim();

export const renderMiddleware = (
  hasMiddleware: boolean,
  hasRewrite: boolean,
  imported: Record<string, RenderSegmentImportArgs>,
  layouts: [string, LayoutType<string>][]
) =>
  `
// auto-generated file, do not edit manually
${staticImportsHeader(hasMiddleware, hasRewrite)}

${renderDynamicImports(imported)}

${renderLayout(layouts)}

${staticExportsFooter}
`.trim() + "\n";
