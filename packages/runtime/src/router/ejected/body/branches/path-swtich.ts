import { PathSegmentSwitch } from "../../types";
import renderBranch from ".";
import { renderSwitchStatement } from "./util";

const renderPathSwitch = ({ index, defaultCase, cases }: PathSegmentSwitch) => {
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
      ${renderBranch(defaultCase)}
      break;
    }`,
  });
};

export default renderPathSwitch;
