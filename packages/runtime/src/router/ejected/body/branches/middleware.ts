import renderBranch from ".";
import { EjectedMiddleware } from "../../types";
import { renderHandler, renderSwitchStatement } from "./util";

const renderMiddleware = ({
  then,
  internalPath,
  location,
}: EjectedMiddleware) =>
  `
middleware_response = await ${renderHandler(
    "middleware",
    location,
    internalPath
  )};
${renderSwitchStatement({
  statement: "middleware_response",
  cases: [
    [
      ["void 0"],
      `{
    ${renderBranch(then)}
    break;
  }`,
    ],
  ],
  default: `{
    break;
  }`,
})}
`.trim();

export default renderMiddleware;
