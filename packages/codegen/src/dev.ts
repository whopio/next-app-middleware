import { build } from "./build";
import CancelToken from "./util/CancelToken";
import logger from "./util/log";
import watchAll from "./util/watch";

const buildWithCatch = async (token?: CancelToken) => {
  try {
    const start = Date.now();
    const cancelled = await build(token);
    if (!cancelled)
      logger.event(
        `generated middleware.ts in ${
          Date.now() - start
        }ms. watching for changes...`
      );
  } catch (e) {
    logger.error("error while generating middleware:", e);
  }
};

const watchConfig = {
  "add unlink": [
    "app/**/middleware.{ts,js}",
    "app/**/page.{tsx,js,jsx}",
    "app/**/redirect.{ts,js}",
    "public/**/*",
  ],
  "add unlink change": ["app/**/forward.{ts,js}", "./middleware.hooks.{ts,js}"],
};

const dev = async () => {
  let cancelToken: CancelToken = new CancelToken();
  let buildPromise: Promise<void> = buildWithCatch(cancelToken);
  const runBuild = async (type: string, file: string) => {
    logger.info(`${type} ${file}, rebuilding...`);
    cancelToken.cancel();
    await buildPromise;
    cancelToken = new CancelToken();
    buildPromise = buildWithCatch(cancelToken);
  };
  watchAll(watchConfig, runBuild);
};

export default dev;
