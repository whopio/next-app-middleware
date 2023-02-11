module.exports = {
  root: true,
  parserOptions: {
    project: ["./packages/*/tsconfig.json", "./examples/*/tsconfig.json"],
  },
  extends: ["ts"],
};
