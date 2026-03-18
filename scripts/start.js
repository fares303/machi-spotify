/* eslint-disable no-console */

const { spawnSync } = require("child_process");

// Railpack/CI uses `npm start` as the build step, so make it build and exit in that context.
// In production, the deploy/runtime command is still `node server.js`.

const isCi =
  process.env.CI === "true" ||
  process.env.CI === "1" ||
  process.env.RAILPACK === "true" ||
  process.env.RAILPACK === "1";

if (isCi) {
  console.log("[start] CI detected; running build and exiting...");
  const result = spawnSync("npm", ["run", "build"], { stdio: "inherit" });
  process.exit(result.status);
}

require("../server.js");
