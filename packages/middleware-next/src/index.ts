import { NextConfig } from "next";
import { build } from "@middleware-next/codegen";

export const withMiddleware =
  (
    next:
      | NextConfig
      | ((phase: string, args: { defaultConfig: NextConfig }) => NextConfig)
  ) =>
  async (phase: string, args: { defaultConfig: NextConfig }) => {
    console.log("running middleware plugin");
    await build();
    return typeof next === "function" ? next(phase, args) : next;
  };

export default withMiddleware;
