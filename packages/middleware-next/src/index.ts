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
    if (phase === PHASE_DEVELOPMENT_SERVER) {
      dev();
    } else {
      await prod();
    }
    return typeof next === "function" ? next(phase, args) : next;
  };

export default withMiddleware;
