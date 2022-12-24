import renderBranch from ".";
import { CatchAllSegment } from "../../types";

const renderCatchAll = ({ name, index, then }: CatchAllSegment) =>
  `
params.${name} = segments.slice(${index}, -1);
${renderBranch(then)}
`.trim();

export default renderCatchAll;
