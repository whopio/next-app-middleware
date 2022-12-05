import type { NextResponse } from "next/server";

export type MiddlewareResponseInternals = {
  readonly res: NextResponse;
};
