import renderBranch from ".";
import { BranchTypes, EjectedRedirect } from "../../types";
import { renderHandler, renderSwitchStatement } from "./util";

const renderRedirect = ({
  location,
  internalPath,
  fallback,
}: EjectedRedirect) =>
  `
const redirect_response = await ${renderHandler(
    "redirect",
    location,
    internalPath
  )};
${renderSwitchStatement({
  statement: "typeof redirect_response",
  cases: [
    [
      ["'undefined'"],
      `{
    ${renderBranch(fallback || { type: BranchTypes.NOT_FOUND })}
    break;
  }`,
    ],
    [
      ["'string'"],
      `{
        middleware_response = {
          redirect: redirect_response
        }
        break;
      }`,
    ],
  ],
  default: `{
    middleware_response = "destination" in redirect_response ? {
      redirect: redirect_response.destination,
      status: redirect_response.status
    } : {
      redirect: redirect_response
    }
    break;
  }`,
})}
`.trim();

export default renderRedirect;
