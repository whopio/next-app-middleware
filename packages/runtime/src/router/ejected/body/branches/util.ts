import getSegmentHash from "../../util/get-hash";

export const renderHandler = (
  type: string,
  location: string,
  internalPath: string,
  imports = "default"
) =>
  `
${type}_${getSegmentHash(location)}.then(({
  ${imports}: ${type}
}) => ${type}(
  req as NextMiddlewareRequest<Params<"${
    internalPath === "//" ? "/" : internalPath
  }">>,
  res
))
`.trim();

type RenderSwitchStatementOptions = {
  statement: string;
  cases: [string[], string][];
  default: string;
};

const renderSwitchCase = (tests: string[], body: string) =>
  `
${tests.map((test) => `case ${test}:`).join("\n")} 
  ${body}
`.trim();

export const renderSwitchStatement = ({
  cases,
  default: defaultMatch,
  statement,
}: RenderSwitchStatementOptions) =>
  `
switch (${statement}) {
  ${cases.map((_case) => renderSwitchCase(..._case)).join("\n")}
  default: 
    ${defaultMatch}
  
}
`.trim();
