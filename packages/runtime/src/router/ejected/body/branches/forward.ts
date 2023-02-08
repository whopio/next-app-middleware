import renderBranch from ".";
import { BranchTypes, EjectedForward } from "../../types";
import { renderHandler, renderSwitchStatement } from "./util";

const renderForward = ({
  then,
  forward,
  name,
  location,
  internalPath,
}: EjectedForward) =>
  `
const forward_response = await ${renderHandler(
    "forward",
    location,
    internalPath,
    name
  )};
${renderSwitchStatement({
  statement: "forward_response",
  cases: [
    [
      ["void 0"],
      `{
    ${
      then
        ? renderBranch(then)
        : `
    throw new Error("MatcherError: Exptected forward at ${location} to return a response as no internal path mathes the request");
  `.trim()
    }
    break;
  }`,
    ],
  ],
  default: `{
    params.${name} = forward_response!;
    ${
      forward
        ? renderBranch(forward)
        : 'throw new Error("MatcherError: Unexpected Layout");'
    }
    break;
  }`,
})}
`.trim();

export default renderForward;
