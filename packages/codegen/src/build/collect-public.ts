import _glob from "glob";
import { promisify } from "util";
const glob = promisify(_glob);
import fse from "fs-extra";
const { stat } = fse;

/**
 * @returns A string array of all the files in the public folder
 */
const collectPublicFiles = async () => {
  const publicFiles = (await glob("public/**/*")).map((path) => path.slice(6));
  try {
    if ((await stat("app/favicon.ico")).isFile())
      publicFiles.push("/favicon.ico");
  } catch {
    /* empty */
  }
  return publicFiles;
};

export default collectPublicFiles;
