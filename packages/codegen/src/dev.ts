import { build } from "./build";
import CancelToken from "./util/CancelToken";
import logger from "./util/log";
import watchAll from "./util/watch";

const buildWithCatch = async (token?: CancelToken) => {
  try {
    const start = Date.now();
    const { cancelled, rewrites } = await build(token);
    if (!cancelled)
      logger.event(
        `generated middleware in ${
          Date.now() - start
        }ms. watching for changes...`
      );
    return rewrites || [];
  } catch (e) {
    logger.error("error while generating middleware:", e);
    return [];
  }
};

const watchConfig = {
  "add unlink": [
    "app/**/external.{ts,js}",
    "app/**/middleware.{ts,js}",
    "app/**/page.{tsx,js,jsx}",
    "app/**/route.{ts,js}",
    "app/**/redirect.{ts,js}",
    "public/**/*",
    "app/favicon.ico",
  ],
  "add unlink change": [
    "app/**/forward.dynamic.{ts,js}",
    "app/**/forward.static.{ts,js}",
    "./middleware.hooks.{ts,js}",
  ],
};

const dev = async () => {
  let cancelToken: CancelToken = new CancelToken();
  let buildPromise = buildWithCatch(cancelToken);
  const rewrites = await buildPromise;
  const runBuild = async (type: string, file: string) => {
    logger.info(`${type} ${file}, rebuilding...`);
    cancelToken.cancel();
    await buildPromise;
    cancelToken = new CancelToken();
    buildPromise = buildWithCatch(cancelToken);
  };
  watchAll(watchConfig, runBuild);
  watchAll({ "add unlink change": ["app/**/external.{ts,js}"] }, () => {
    logger.warn(
      "detected change in external config... restart may be required to apply changes"
    );
  });
  return rewrites;
};

export default dev;
