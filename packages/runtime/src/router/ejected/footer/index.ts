const renderMatcherPattern = (segments: number) =>
  segments > 0
    ? `
/((?!_next(?:$|\/)|api(?:$|\/))[^\/]+\/?|$)${`([^\/]+\/?|$)`.repeat(
        segments - 1
      )}
`.trim()
    : "/";

const renderFooter = (segmentAmount: number) =>
  `
export const config = {
  matcher: "${renderMatcherPattern(segmentAmount)}"
}
`.trim();

export default renderFooter;
