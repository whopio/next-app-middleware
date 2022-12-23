import renderBranch from ".";
import { DynamicSegment } from "../../types";

const renderDynamic = ({ name, index, then }: DynamicSegment) =>
  `
params.${name} = segments[${index}];
${renderBranch(then)}
`.trim();

export default renderDynamic;
