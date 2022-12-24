import { EjectedNextResponse } from "../../types";

const renderNext = ({ internalPath }: EjectedNextResponse) =>
  (internalPath
    ? `
next = (final_params) =>
  \`${internalPath
    .replace(/\/(:[^/]*)/gm, (match, value) => {
      return match.replace(value, `\${final_params.${value.slice(1)}}`);
    })
    .replace(/\/(\*[^\/]*)\/$/gm, (match, value) => {
      return match.replace(
        value,
        `\${(final_params.${value.slice(1)} as string[]).join("/")}`
      );
    })}\`
`
    : `
next = true;
`
  ).trim();

export default renderNext;
