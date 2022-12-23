import { watch } from "chokidar";

const watchAll = (
  config: Record<string, string[]>,
  onTrigger: (event: string, file: string) => any
) => {
  Object.entries(config).forEach(([events, files]) => {
    const watcher = watch(files, { ignoreInitial: true });
    events
      .split(" ")
      .forEach((event) => watcher.on(event, (file) => onTrigger(event, file)));
  });
};

export default watchAll;
