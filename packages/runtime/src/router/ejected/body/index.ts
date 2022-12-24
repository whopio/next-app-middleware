import { EjectedRouter } from "../types";
import renderBranch from "./branches";
import renderBodyFooter from "./footer";
import bodyHead from "./head";

const renderBody = ({ hooks, branches }: EjectedRouter) =>
  `
export const middleware: NextMiddleware = async (nextRequest, ev) => {
  ${bodyHead}
  try {
    ${renderBranch(branches)}
  } catch (e) {
    const error = e instanceof Error ? e : new Error(\`Runtime Exception: \${e}\`);
    ${
      hooks.error
        ? `
      response = (await errorHook(req, res, error)) || undefined;
      if (!response) throw error;
    `
        : "throw error"
    }
  }
  ${renderBodyFooter(hooks)}
}
`.trim();

export default renderBody;
