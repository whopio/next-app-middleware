import renderBranch from ".";
import { BranchTypes, EjectedRewrite } from "../../types";
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
    ${renderBranch(fallback || { type: BranchTypes.NOT_FOUND })}
    break;
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
