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
  try {
    ${renderBranches(branches)}
  } catch (e) {
    const error = e instance of Error ? e : new Error(\`Runtime Exception: \${e}\`);
    ${
      hooks.error
        ? `
      response = await errorHook(req, res, error);
      if (!response) throw error;
    `
        : "throw error"
    }
  }
  ${renderBodyFooter(hooks)}
}
`.trim();

export default renderBody;
