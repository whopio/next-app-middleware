import _glob from "glob";
import { promisify } from "util";
const glob = promisify(_glob);

const collectPublicFiles = async () => {
  return (await glob("public/**/*")).map((path) => path.slice(6));
};

export default collectPublicFiles;
