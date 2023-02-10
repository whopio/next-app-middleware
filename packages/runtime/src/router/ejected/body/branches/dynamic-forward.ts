import renderBranch from ".";
import { EjectedDynamicForward } from "../../types";
import { renderHandler, renderSwitchStatement } from "./util";

const renderDynamicForward = ({
  then,
  forward,
  name,
  location,
  internalPath,
}: EjectedDynamicForward) =>
  `
const forward_response: string | void = await ${renderHandler(
    "forward_dynamic",
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

export default renderDynamicForward;
