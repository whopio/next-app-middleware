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
    ${renderBranch(then || { type: BranchTypes.NOT_FOUND })}
    break;
  }`,
    ],
  ],
  default: `{
    params.${name} = forward_response!;
    ${
      forward
        ? renderBranch(forward)
        : `
      throw new Error("Exptected forward at ${location} to return a response as no internal path mathes the request");
    `
    }
    break;
  }`,
})}
`.trim();

export default renderForward;
