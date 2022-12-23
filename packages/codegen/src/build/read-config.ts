import { RouterHooksConfig } from "@next-app-middleware/runtime/dist/router/ejected";
import _glob from "glob";
import { promisify } from "util";
import logger from "../util/log";
import collectModuleExports from "./collect-exports";

const glob = promisify(_glob);

const defaultHooksConfig: RouterHooksConfig = {
  notFound: false,
  redirect: false,
  rewrite: false,
  json: false,
  params: false,
  response: false,
  error: false,
};

const readHooksConfig = async () => {
  const matches = await glob("./middleware.hooks.{ts,js}");
  if (matches.length === 0)
    return {
      ...defaultHooksConfig,
    };
  if (matches.length > 1)
    logger.warn("Multiple middleware configs found, using:", matches[0]);
  const exports = await collectModuleExports(matches[0]);
  const config = {
    ...defaultHooksConfig,
  };
  exports.forEach((key) => {
    if (Object.hasOwn(config, key)) config[key as keyof typeof config] = true;
  });
  return config;
};

export default readHooksConfig;
