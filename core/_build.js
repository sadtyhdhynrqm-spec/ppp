import "../cleanup.js";

import {} from "dotenv/config";
import { writeFileSync } from "fs";
import { resolve as resolvePath } from "path";
import logger from "./var/modules/logger.js";

import login from "nexus-fca";
import startServer from "./dashboard/server/app.js";
import handleListen from "./handlers/listen.js";
import { isGlitch, isReplit } from "./var/modules/environments.get.js";
import initializeVar from "./var/_init.js";
import { getLang, loadPlugins } from "./var/modules/loader.js";

import * as aes from "./var/modules/aes.js";
import { checkAppstate } from "./var/modules/checkAppstate.js";

import replitDB from "@replit/database";
import { execSync } from "child_process";
import { XDatabase } from "./handlers/database.js";
import { Assets } from "./handlers/assets.js";

import crypto from "crypto";

/* =======================
   GLOBAL PROTECTION
======================= */
process.on("unhandledRejection", (err) => {
  logger.error("Unhandled Rejection:");
  console.error(err);
});

process.on("uncaughtException", (err) => {
  logger.error("Uncaught Exception:");
  console.error(err);
});

process.on("SIGINT", shutdownSafe);
process.on("SIGTERM", shutdownSafe);
process.on("SIGHUP", shutdownSafe);

function shutdownSafe() {
  try {
    logger.system(getLang("build.start.exit"));
    if (global.listenMqtt?.stopListening) {
      global.listenMqtt.stopListening();
    }
  } catch {}
  process.exit(0);
}

process.stdout.write(
  String.fromCharCode(27) + "]0;" + "Xavia" + String.fromCharCode(7)
);

/* =======================
   INIT
======================= */
await initializeVar();

/* =======================
   START BOT
======================= */
async function start() {
  try {
    console.clear();
    logger.system(getLang("build.start.varLoaded"));
    logger.custom(getLang("build.start.logging"), "LOGIN");

    const api = await loginState();
    global.api = api;
    global.botID = api.getCurrentUserID();

    logger.custom(
      getLang("build.start.logged", { botID: global.botID }),
      "LOGIN"
    );

    const xDatabase = new XDatabase(api, global.config.DATABASE);
    await xDatabase.init();

    new Assets();
    logger.custom(getLang("build.start.plugin.loading"), "LOADER");
    await loadPlugins(xDatabase);

    const serverAdminPassword = getRandomPassword(8);
    process.env.SERVER_ADMIN_PASSWORD = serverAdminPassword;
    startServer(serverAdminPassword);

    await booting(api, xDatabase);
  } catch (err) {
    logger.error(err);
    shutdownSafe();
  }
}

/* =======================
   BOOTING
======================= */
async function booting(api, xDatabase) {
  global.controllers = {
    Threads: xDatabase.threads,
    Users: xDatabase.users,
  };

  startListen(api, xDatabase);
  refreshState(); // فقط حفظ appstate
}

/* =======================
   SAFE MQTT (NO REFRESH)
======================= */
async function startListen(api, xDatabase) {
  const listenerID = generateListenerID();
  global.listenerID = listenerID;

  global.listenMqtt = api.listenMqtt(
    await handleListen(listenerID, xDatabase)
  );

  logger.custom("MQTT listener started (stable mode).", "MQTT");
}

/* =======================
   APPSTATE SAVE (12H)
======================= */
const _12HOUR = 1000 * 60 * 60 * 12;

function refreshState() {
  setInterval(() => {
    try {
      const newAppState = global.api.getAppState();

      if (global.config.APPSTATE_PROTECTION === true) {
        if (isGlitch) {
          writeFileSync(
            resolvePath(process.cwd(), ".data", "appstate.json"),
            JSON.stringify(newAppState, null, 2)
          );
        } else if (isReplit) {
          const db = new replitDB();
          db.get("APPSTATE_SECRET_KEY").then((key) => {
            if (!key) return;
            const encrypted = aes.encrypt(
              JSON.stringify(newAppState),
              key
            );
            writeFileSync(
              resolvePath(global.config.APPSTATE_PATH),
              JSON.stringify(encrypted)
            );
          });
        }
      } else {
        writeFileSync(
          resolvePath(global.config.APPSTATE_PATH),
          JSON.stringify(newAppState, null, 2)
        );
      }
    } catch (e) {
      logger.error("Failed to refresh appstate");
      console.error(e);
    }
  }, _12HOUR);
}

/* =======================
   LOGIN
======================= */
async function loginState() {
  const appState = await checkAppstate(
    global.config.APPSTATE_PATH,
    global.config.APPSTATE_PROTECTION
  );

  const options = {
    ...global.config.FCA_OPTIONS,
    enableAutoRefresh: false,
    ultraLowBanMode: true,
    enableAntiDetection: true,
    enableHumanBehavior: true,
  };

  return await login({ appState }, options);
}

/* =======================
   UTILS
======================= */
function generateListenerID() {
  return Date.now() + crypto.randomBytes(4).toString("hex");
}

function getRandomPassword(length = 8) {
  return crypto.randomBytes(length).toString("hex").slice(0, length);
}

/* =======================
   RUN
======================= */
start();
