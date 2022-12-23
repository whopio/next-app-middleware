import { Branch, EjectedRouter } from "../types";
import renderBranch from "./branches";
import renderBodyFooter from "./footer";
import bodyHead from "./head";

const renderBranches = (branches: Branch[]) =>
  `
switch (segments.length - 1) {
  ${branches
    .map((branch, idx) =>
      branch
        ? `
    case ${idx}: {
      ${renderBranch(branch)}
      break;
    }
  `.trim()
        : ""
    )
    .filter(Boolean)
    .join("\n")}
  default: {
    notFound = true;
    break;
  }
}
`.trim();

const renderBody = ({ hooks, branches }: EjectedRouter) =>
  `
export const middleware: NextMiddleware = async (nextRequest, ev) => {
  ${bodyHead}
  ${renderBranches(branches)}
  ${renderBodyFooter(hooks)}
}
`.trim();

export default renderBody;
