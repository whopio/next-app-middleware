import renderBranch from ".";
import { EjectedRewrite } from "../../types";
import { renderHandler, renderSwitchStatement } from "./util";

const renderRewrite = ({ location, fallback, internalPath }: EjectedRewrite) =>
  `
const rewrite_response = await ${renderHandler(
    "rewrite",
    location,
    internalPath
  )};
${renderSwitchStatement({
  statement: "typeof rewrite_response",
  cases: [
    [
      ["'undefined'"],
      `{
        ${
          fallback
            ? `${renderBranch(fallback)}
        break;`
            : `
            throw new Error(
              "MatchingError: rewrite at ${location} must return a value as neiter a redirect nor a page exists"
            );
        `.trim()
        }
      }`,
    ],
  ],
  default: `{
    middleware_response = {
      rewrite: rewrite_response
    }
    break;
  }`,
})}
`.trim();

export default renderRewrite;
