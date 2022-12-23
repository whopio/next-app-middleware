import type { ResponseHook } from "next-app-middleware/runtime";

export const response: ResponseHook = (res) => {
  console.log(res.status);
};
