import fse from "fs-extra";
import { join } from "path";
import { SegmentLayout } from "../types";
import collectModuleExports from "./collect-exports";
import {
  catchAllSegmentRegex,
  dynamicSegmentRegex,
  findForward,
  findMiddleware,
  findPage,
  findRedirect,
  findRewrite,
  isCatchAllSegment,
  isRouteGroupSegment,
  routeGroupSegmentRegex,
} from "./regex";

const { readdir, stat } = fse;

const collectForwards = async (dir: string, filesAndFolders: string[]) => {
  const forwardFile = findForward(filesAndFolders);
  if (forwardFile) {
    return await collectModuleExports(join(dir, forwardFile));
  } else return [];
};

const collectChildren = async (
  dir: string,
  externalPath: string,
  filesAndFolders: string[],
  forward: string[],
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
            if (forward.includes(match[1])) {
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
  parentForward: string[] = [],
  getParent?: () => SegmentLayout
) => {
  const filesAndFolders = await readdir(dir);
  const [currentSegment] = dir.split("/").reverse();
  const dynamic = dynamicSegmentRegex.exec(currentSegment)?.[1];
  const forward = isRouteGroupSegment(currentSegment)
    ? parentForward
    : await collectForwards(dir, filesAndFolders);
  const catchAll = isCatchAllSegment(currentSegment);
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
          .join("/") + "/";
  const layoutPage = findPage(filesAndFolders);
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
    hash,
    dynamic,
    catchAll,
    forward,
    rewrite: !!findRewrite(filesAndFolders),
    redirect: !!findRedirect(filesAndFolders),
    page: !!layoutPage,
    middleware: !!layoutMiddleware,
    children: await collectChildren(
      dir,
      externalPath,
      filesAndFolders,
      forward,
      () => layout
    ),
    parent: getParent,
  };
  return layout;
};

export default collectLayout;
