import { readFileSync, writeFileSync, existsSync, statSync } from "fs";
import { spawn, execSync } from "child_process";
import semver from "semver";
import axios from "axios";

import {} from "dotenv/config";
import logger from "./core/var/modules/logger.js";
import { loadPlugins } from "./core/var/modules/installDep.js";

import {
  isGlitch,
  isReplit,
  isGitHub,
} from "./core/var/modules/environments.get.js";

console.clear();

// =======================
// GLOBAL ERROR PROTECTION
// =======================
process.on("unhandledRejection", (err) => {
  logger.error("Unhandled Rejection:");
  console.error(err);
});

process.on("uncaughtException", (err) => {
  logger.error("Uncaught Exception:");
  console.error(err);
});

// =======================
// NODE VERSION FIX (REPLIT)
// =======================
function upNodeReplit() {
  return new Promise((resolve) => {
    execSync(
      "npm i --save-dev node@16 && npm config set prefix=$(pwd)/node_modules/node && export PATH=$(pwd)/node_modules/node/bin:$PATH"
    );
    resolve();
  });
}

(async () => {
  if (process.version.slice(1).split(".")[0] < 16) {
    if (isReplit) {
      try {
        logger.warn("Installing Node.js v16 for Replit...");
        await upNodeReplit();
        if (process.version.slice(1).split(".")[0] < 16)
          throw new Error("Failed to install Node.js v16.");
      } catch (err) {
        logger.error(err);
        process.exit(1);
      }
    }
    logger.error(
      "Xavia requires Node 16 or higher. Please update your Node version."
    );
    process.exit(1);
  }

  if (isGlitch) {
    const WATCH_FILE = {
      restart: { include: ["\\.json"] },
      throttle: 3000,
    };

    if (
      !existsSync(process.cwd() + "/watch.json") ||
      !statSync(process.cwd() + "/watch.json").isFile()
    ) {
      logger.warn("Glitch detected. Creating watch.json...");
      writeFileSync(
        process.cwd() + "/watch.json",
        JSON.stringify(WATCH_FILE, null, 2)
      );
      execSync("refresh");
    }
  }

  if (isGitHub) {
    logger.warn("Running on GitHub is not recommended.");
  }
})();

// =======================
// UPDATE CHECK
// =======================
async function checkUpdate() {
  logger.custom("Checking for updates...", "UPDATE");
  try {
    const res = await axios.get(
      "https://raw.githubusercontent.com/XaviaTeam/XaviaBot/main/package.json"
    );

    const { version } = res.data;
    const currentVersion = JSON.parse(
      readFileSync("./package.json")
    ).version;

    if (semver.lt(currentVersion, version)) {
      logger.warn(`New version available: ${version}`);
      logger.warn(`Current version: ${currentVersion}`);
    } else {
      logger.custom("No updates available.", "UPDATE");
    }
  } catch {
    logger.error("Failed to check for updates.");
  }
}

// =======================
// SAFE MQTT REFRESH
// =======================
const ONE_HOUR = 60 * 60 * 1000;

function refreshListenMQTT() {
  try {
    if (typeof global.listenmqtt === "function") {
      global.listenmqtt();
      logger.custom("listenmqtt refreshed safely.", "MQTT");
    }
  } catch (err) {
    logger.error("listenmqtt refresh failed:");
    console.error(err);
  }
}

// =======================
// MAIN + AUTO RESTART
// =======================
let child = null;

async function main() {
  await checkUpdate();
  await loadPlugins();

  logger.custom("Starting XaviaBot child process...", "SYSTEM");

  child = spawn(
    "node",
    [
      "--trace-warnings",
      "--experimental-import-meta-resolve",
      "core/_build.js",
    ],
    {
      cwd: process.cwd(),
      stdio: "inherit",
      env: process.env,
    }
  );

  child.on("close", (code) => {
    logger.error(`Child process exited with code ${code}`);
    logger.warn("Restarting bot in 5 seconds...");
    setTimeout(main, 5000);
  });
}

// 🔕 عطلت MQTT refresh مؤقتًا للاستقرار
// إذا استقر البوت 6+ ساعات نرجعه
// setInterval(refreshListenMQTT, ONE_HOUR);

main();
