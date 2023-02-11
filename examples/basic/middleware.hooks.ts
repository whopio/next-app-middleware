import type {
  ResponseHook,
  ErrorHook,
  GenericHook,
  ParamsHook,
} from "next-app-middleware/runtime";
import { NextResponse } from "next/server";

export const response: ResponseHook = (res) => {
  console.log(res.status);
};

export const error: ErrorHook = (_, _2, err) => {
  console.error(err);
};

export const notFound: GenericHook = () => {
  return new NextResponse("not found", { status: 404 });
};

export const params: ParamsHook = (p) => {
  return p;
};
