import { NextConfig } from "next";
import { prod, dev } from "@next-app-middleware/codegen";
import { PHASE_DEVELOPMENT_SERVER } from "next/dist/shared/lib/constants";

export const withMiddleware =
  (
    next:
      | NextConfig
      | ((phase: string, args: { defaultConfig: NextConfig }) => NextConfig)
  ) =>
  async (phase: string, args: { defaultConfig: NextConfig }) => {
    let result: ReturnType<typeof prod>;
    if (phase === PHASE_DEVELOPMENT_SERVER) {
      result = dev();
    } else {
      result = prod();
    }
    const cfg = typeof next === "function" ? next(phase, args) : next;
    const oldRewriteGetter = cfg.rewrites;
    cfg.rewrites = async () => {
      const oldRewrites = oldRewriteGetter ? await oldRewriteGetter() : [];
      if (oldRewrites instanceof Array) {
        return [...(await result), ...oldRewrites];
      } else {
        return {
          ...oldRewrites,
          afterFiles: [...(await result), ...oldRewrites.afterFiles],
        };
      }
    };
    return cfg;
  };

export default withMiddleware;
