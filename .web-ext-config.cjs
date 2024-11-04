module.exports = {
  sourceDir: "dist",
  artifactsDir: "web-ext-artifacts",
  build: {
    overwriteDest: true
  },
  sign: {
    channel: "listed"
  }
};