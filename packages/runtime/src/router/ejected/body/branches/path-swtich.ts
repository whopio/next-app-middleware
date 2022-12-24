import { PathSegmentSwitch } from "../../types";
import renderBranch from ".";
import { renderSwitchStatement } from "./util";

const renderPathSwitch = ({
  index,
  defaultCase,
  cases,
  catchAll,
}: PathSegmentSwitch) => {
  return renderSwitchStatement({
    statement: `segments[${index}]`,
    cases: cases.map(({ match, then }) => {
      if (!(match instanceof Array)) {
        match = [match];
      }
      return [
        match.map((single) => `"${single}"`),
        `{
        ${renderBranch(then)}
        break;
      }
      `,
      ];
    }),
    default: `{
      ${renderBranch(defaultCase)}${
      catchAll
        ? `
        if (notFound) {
          notFound = false;
          ${renderBranch(catchAll)}
        }
      `
        : ""
    }break;
    }`,
  });
};

export default renderPathSwitch;
