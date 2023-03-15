import { EjectedRouter } from "../types";
import renderDynamicImports from "./dynamic";
import renderHooksImport from "./hooks";
import staticImports from "./static";

const renderHead = ({ hooks, imports, publicFiles }: EjectedRouter) =>
  `
${staticImports}
${renderHooksImport(hooks)}

${renderDynamicImports(imports)}

const publicFiles = new Set<string>([${Array.from(new Set(publicFiles))
    .map((publicFile) => `"${publicFile}"`)
    .join(", ")}]);
`.trim();

export default renderHead;
