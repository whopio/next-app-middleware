import { Imports } from "../types";
import getSegmentHash from "../util/get-hash";

const importTypes: (keyof Imports)[] = [
  "middleware",
  "forward.dynamic",
  "forward.static",
  "rewrite",
  "redirect",
];

const renderDynamicImports = (imports: Imports) =>
  `
${(Object.keys(imports) as (keyof Imports)[])
  .sort((a, b) => importTypes.indexOf(a) - importTypes.indexOf(b))
  .map((type) =>
    Array.from(imports[type])
      .map((location) =>
        `
    const ${type.replace(".", "_")}_${getSegmentHash(
          location
        )} = import("./${location}/${type}");
  `.trim()
      )
      .join("\n")
  )
  .join("\n")}
`.trim();

export default renderDynamicImports;
