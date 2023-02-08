import { build } from "./build";
import logger from "./util/log";

const prod = async () => {
  try {
    const start = Date.now();
    const { cancelled, rewrites } = await build();
    if (cancelled) throw new Error("Middleware build cancelled"); // should not happen
    logger.success(`generated middleware in ${Date.now() - start}ms`);
    return rewrites!;
  } catch (e) {
    logger.error("error while generating middleware:", e);
    process.exit(1);
  }
};

export default prod;
