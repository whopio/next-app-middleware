import type { RewriteHandler } from "next-app-middleware/runtime";

const rewrite: RewriteHandler<{ theme: string }> = ({ params: { theme } }) => {
  return "/" + theme;
};

export default rewrite;
