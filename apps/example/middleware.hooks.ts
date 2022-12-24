import type { ResponseHook, ErrorHook } from "next-app-middleware/runtime";

export const response: ResponseHook = (res) => {
  console.log(res.status);
};

export const error: ErrorHook = (_, _2, err) => {
  console.error(err);
};
