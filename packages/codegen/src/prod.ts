import { build } from "./build";
import logger from "./util/log";

const prod = async () => {
  try {
    const start = Date.now();
    await build();
    logger.success(`generated middleware in ${Date.now() - start}ms`);
  } catch (e) {
    logger.error("error while generating middleware:", e);
    process.exit(1);
  }
};

export default prod;
