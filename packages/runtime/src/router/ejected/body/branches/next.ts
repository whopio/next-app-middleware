import { EjectedNextResponse } from "../../types";

const isDynamic = (internalPath: string) =>
  internalPath.includes("/:") || /\/(\*[^/]*)\/$/.test(internalPath);

const renderNext = ({ internalPath, externalPath }: EjectedNextResponse) =>
  (isDynamic(internalPath)
    ? `
next = (final_params) =>
  \`${internalPath
    .replace(/\/(:[^/]*)/gm, (match, value) => {
      return match.replace(value, `\${final_params.${value.slice(1)}}`);
    })
    .replace(/\/(\*[^/]*)\/$/gm, (match, value) => {
      return match.replace(
        value,
        `\${(final_params.${value.slice(1)} as string[]).join("/")}`
      );
    })}\`
`
    : internalPath !== "//" && internalPath !== externalPath
    ? `
next = "${internalPath}";
`
    : `
next = true;
`
  ).trim();

export default renderNext;
