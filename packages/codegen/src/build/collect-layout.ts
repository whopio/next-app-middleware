import fse from "fs-extra";
import { join } from "path";
import { Forwards, SegmentLayout } from "../types";
import collectModuleExports from "./collect-exports";
import {
  catchAllSegmentRegex,
  dynamicSegmentRegex,
  findDynamicForward,
  findExternal,
  findMiddleware,
  findPage,
  findRedirect,
  findRewrite,
  findStaticForward,
  isCatchAllSegment,
  isRouteGroupSegment,
  routeGroupSegmentRegex,
} from "./regex";

const { readdir, stat } = fse;

const collectForwards = async (dir: string, filesAndFolders: string[]) => {
  const dynamicForwardFile = findDynamicForward(filesAndFolders);
  const dynamicForwardsPromise = dynamicForwardFile
    ? collectModuleExports(join(dir, dynamicForwardFile))
    : Promise.resolve([]);
  const staticForwardFile = findStaticForward(filesAndFolders);
  const staticForwardsPromise = staticForwardFile
    ? collectModuleExports(join(dir, staticForwardFile))
    : Promise.resolve([]);
  return {
    dynamic: await dynamicForwardsPromise,
    static: await staticForwardsPromise,
  };
};

const collectChildren = async (
  dir: string,
  externalPath: string,
  filesAndFolders: string[],
  forward: Forwards,
  getParent: () => SegmentLayout
) => {
  const children: Record<string, SegmentLayout> = {};
  await Promise.all(
    filesAndFolders.map(async (fileOrFolder) => {
      const stats = await stat(join(dir, fileOrFolder));
      if (stats.isDirectory()) {
        if (isRouteGroupSegment(fileOrFolder)) {
          children[fileOrFolder] = await collectLayout(
            join(dir, fileOrFolder),
            externalPath,
            forward,
            getParent
          );
        } else if (isCatchAllSegment(fileOrFolder)) {
          const match = catchAllSegmentRegex.exec(fileOrFolder);
          children[fileOrFolder] = await collectLayout(
            join(dir, fileOrFolder),
            join(externalPath, `*${match![1]}`),
            forward,
            getParent
          );
        } else {
          const match = dynamicSegmentRegex.exec(fileOrFolder);
          if (match) {
            if (forward.dynamic.includes(match[1])) {
              children[fileOrFolder] = await collectLayout(
                join(dir, fileOrFolder),
                externalPath,
                forward,
                getParent
              );
            } else {
              children[fileOrFolder] = await collectLayout(
                join(dir, fileOrFolder),
                join(externalPath, `:${match[1]}`),
                forward,
                getParent
              );
            }
          } else {
            if (forward.static.includes(fileOrFolder))
              children[fileOrFolder] = await collectLayout(
                join(dir, fileOrFolder),
                externalPath,
                forward,
                getParent
              );
            else
              children[fileOrFolder] = await collectLayout(
                join(dir, fileOrFolder),
                join(externalPath, fileOrFolder),
                forward,
                getParent
              );
          }
        }
      }
    })
  );
  return children;
};

const collectLayout = async (
  dir: string = "app",
  externalPath = "/",
  parentForward: Forwards = { dynamic: [], static: [] },
  getParent?: () => SegmentLayout
) => {
  const filesAndFolders = await readdir(dir);
  const [currentSegment] = dir.split("/").reverse();
  const dynamic = dynamicSegmentRegex.exec(currentSegment)?.[1];
  const forward = isRouteGroupSegment(currentSegment)
    ? parentForward
    : await collectForwards(dir, filesAndFolders);
  const catchAll = isCatchAllSegment(currentSegment);
  const external = findExternal(filesAndFolders);
  const hash =
    externalPath === "/"
      ? "/"
      : externalPath
          .split("/")
          .map((segment) =>
            segment.startsWith(":")
              ? ":"
              : segment.startsWith("*")
              ? "*"
              : segment
          )
          .join("/") +
        (external ? "/\\" : "") +
        "/";
  const layoutPage = findPage(filesAndFolders);
  if (layoutPage && external)
    throw new Error(
      `Error while collecting routing config for "${dir}": page and external can not exist in the same segment.`
    );
  const layoutMiddleware = findMiddleware(filesAndFolders);
  const layout: SegmentLayout = {
    location: dir,
    internalPath:
      dir === "app"
        ? "/"
        : "/" +
          dir
            .replace(/^app\//, "")
            .split("/")
            .map((segment) => {
              if (routeGroupSegmentRegex.test(segment)) return false;
              const match = dynamicSegmentRegex.exec(segment);
              if (!match) {
                const catchAllMatch = catchAllSegmentRegex.exec(segment);
                if (!catchAllMatch) return segment;
                return `*${catchAllMatch[1]}`;
              } else return `:${match[1]}`;
            })
            .filter(Boolean)
            .join("/") +
          "/",
    externalPath: externalPath === "/" ? "/" : externalPath + "/",
    segment: currentSegment,
    group: isRouteGroupSegment(currentSegment),
    staticForward: parentForward.static.includes(currentSegment),
    hash,
    dynamic,
    catchAll,
    forward,
    rewrite: !!findRewrite(filesAndFolders),
    redirect: !!findRedirect(filesAndFolders),
    page: !!layoutPage,
    external,
    middleware: !!layoutMiddleware,
    children: !external
      ? await collectChildren(
          dir,
          externalPath,
          filesAndFolders,
          forward,
          () => layout
        )
      : {},
    parent: getParent,
  };
  return layout;
};

export default collectLayout;
