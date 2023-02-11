import { SegmentLayout } from "../types";
import { join } from "path";
import runScrpt from "../util/run-script";

type ConfigRewrite = {
  source: string;
  destination: string;
};

const getConfigRewrites = async (
  segments: SegmentLayout[]
): Promise<ConfigRewrite[]> => {
  return (
    await Promise.all(
      segments.map(async (segment) => {
        if (segment.internalPath !== segment.externalPath)
          throw new Error("external.ts files can not depend on a forward");
        if (segment.hash.includes("/:/"))
          throw new Error("external.ts path can not have dynamic segment");
        if (typeof segment.external !== "string")
          throw new Error(
            "Expected segment.external to be of type string when getting config rewrites."
          );
        const { default: origin } = await runScrpt<{ default: string }>(
          join(process.cwd(), segment.location, segment.external)
        );
        const url = new URL(segment.hash.replace("/\\/", ""), origin);
        return [
          {
            source: url.pathname,
            destination: url.href,
          },
          {
            source: url.pathname + "/:path*",
            destination: url.href + "/:path*",
          },
        ];
      })
    )
  ).flat();
};

export default getConfigRewrites;
