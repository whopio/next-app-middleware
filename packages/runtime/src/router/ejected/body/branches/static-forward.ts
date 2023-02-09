import renderBranch from ".";
import { EjectedStaticForward } from "../../types";
import { renderHandler, renderSwitchStatement } from "./util";

const renderStaticForward = ({
  then,
  forward,
  name,
  location,
  internalPath,
}: EjectedStaticForward) =>
  `
const forward_response: boolean | void = await ${renderHandler(
    "forward_static",
    location,
    internalPath,
    name
  )};
${renderSwitchStatement({
  statement: "forward_response",
  cases: [
    [
      ["true"],
      `{
        ${
          forward
            ? renderBranch(forward)
            : 'throw new Error("MatcherError: Unexpected Layout");'
        }
        break;
  }`,
    ],
  ],
  default: `{
    ${
      then
        ? renderBranch(then)
        : `
    throw new Error("MatcherError: Exptected forward at ${location} to return true as no internal path mathes the request");
  `.trim()
    }
    break;
  }`,
})}
`.trim();

export default renderStaticForward;
