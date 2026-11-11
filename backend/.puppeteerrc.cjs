
const path = require("node:path");

/**
 * Keep Puppeteer's downloaded browser inside the backend's
 * node_modules directory so its location is predictable
 * across the Render build and runtime.
 */
module.exports = {
  cacheDirectory: path.join(
    __dirname,
    "node_modules",
    ".cache",
    "puppeteer"
  ),
};
