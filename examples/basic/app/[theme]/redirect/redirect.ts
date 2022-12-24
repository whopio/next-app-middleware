import type { RedirectHandler } from "next-app-middleware/runtime";

const redirect: RedirectHandler<{ theme: string }> = () => {
  return "/";
};

export default redirect;
