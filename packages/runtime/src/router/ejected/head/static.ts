const staticImports = `/* eslint-disable */
import type {
  MiddleWareHandlerResult,
  NextMiddlewareInternals,
  NextMiddlewareRequest,
  NextMiddlewareResponse,
  Params,
  ParamType,
  RuntimeNext
} from "next-app-middleware/runtime";
import { ResponseCookies } from "next/dist/server/web/spec-extension/cookies/response-cookies";
import { NextMiddleware, NextResponse } from "next/server";`;

export default staticImports;
