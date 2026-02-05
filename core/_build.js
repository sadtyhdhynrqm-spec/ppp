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
import { XDatabase } from "./handlers/database.js";
import { Assets } from "./handlers/assets.js";

import crypto from "crypto";

/* =======================
   GLOBAL PROTECTION
======================= */
process.on("unhandledRejection", console.error);
process.on("uncaughtException", console.error);

process.on("SIGINT", shutdownSafe);
process.on("SIGTERM", shutdownSafe);
process.on("SIGHUP", shutdownSafe);

function shutdownSafe() {
  try {
    logger.system("Shutdown safely...");
    global.listenMqtt?.stopListening?.();
    clearInterval(global.memoryWatcher);
  } catch {}
  process.exit(0);
}

/* =======================
   INIT
======================= */
await initializeVar();

/* =======================
   MEMORY WATCHER (RAM FIX)
======================= */
const MAX_RAM_MB = 850; // عدل حسب السيرفر
const RAM_CHECK = 30_000;

global.memoryWatcher = setInterval(() => {
  const used = process.memoryUsage().rss / 1024 / 1024;

  if (global.gc) global.gc();

  if (used > MAX_RAM_MB) {
    logger.error(`RAM ${used.toFixed(0)}MB → restarting`);
    restartBot(true);
  }
}, RAM_CHECK);

/* =======================
   START BOT
======================= */
async function start() {
  try {
    console.clear();
    logger.system(getLang("build.start.varLoaded"));

    const api = await loginState();
    global.api = api;
    global.botID = api.getCurrentUserID();

    const xDatabase = new XDatabase(api, global.config.DATABASE);
    await xDatabase.init();

    new Assets();
    await loadPlugins(xDatabase);

    const adminPass = getRandomPassword(8);
    process.env.SERVER_ADMIN_PASSWORD = adminPass;
    startServer(adminPass);

    await booting(api, xDatabase);

    startHeartbeat(); // ❤️ مهم جداً
  } catch (err) {
    console.error(err);
    process.exit(1);
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

  await startListen(api, xDatabase);
  refreshState();
}

/* =======================
   MQTT LISTENER (SAFE)
======================= */
async function startListen(api, xDatabase) {
  try {
    global.listenMqtt?.stopListening?.();
  } catch {}

  const listenerID = generateListenerID();
  const handler = await handleListen(listenerID, xDatabase);

  global.listenMqtt = api.listenMqtt(handler);

  global.listenMqtt.on("error", async () => {
    logger.error("MQTT lost → reconnect");
    await restartBot();
  });

  logger.custom("MQTT started safely", "MQTT");
}

/* =======================
   AUTO RECONNECT (COOLDOWN)
======================= */
let reconnecting = false;

async function restartBot(force = false) {
  if (reconnecting && !force) return;
  reconnecting = true;

  try {
    global.listenMqtt?.stopListening?.();
    await new Promise(r => setTimeout(r, 5000));

    const api = await loginState();
    global.api = api;
    global.botID = api.getCurrentUserID();

    const xDatabase = new XDatabase(api, global.config.DATABASE);
    await xDatabase.init();

    await booting(api, xDatabase);
    logger.system("Reconnected successfully ✔");
  } catch (e) {
    console.error(e);
  } finally {
    reconnecting = false;
  }
}

/* =======================
   HEARTBEAT (12H FIX)
======================= */
function startHeartbeat() {
  setInterval(async () => {
    try {
      if (!global.api) return;
      await global.api.getUserInfo(global.botID);
      logger.custom("Heartbeat OK", "HEART");
    } catch {
      logger.error("Heartbeat failed → reconnect");
      restartBot(true);
    }
  }, 1000 * 60 * 5); // كل 5 دقائق
}

/* =======================
   APPSTATE SAFE SAVE
======================= */
const _12HOUR = 1000 * 60 * 60 * 12;

function refreshState() {
  setInterval(() => {
    try {
      if (!global.api) return;

      const state = global.api.getAppState();
      if (!Array.isArray(state)) return;

      writeFileSync(
        resolvePath(global.config.APPSTATE_PATH),
        JSON.stringify(state, null, 2)
      );

      logger.custom("AppState saved safely", "STATE");
    } catch {}
  }, _12HOUR);
}

/* =======================
   LOGIN (ANTI 12H)
======================= */
async function loginState() {
  const appState = await checkAppstate(
    global.config.APPSTATE_PATH,
    global.config.APPSTATE_PROTECTION
  );

  return await login(
    { appState },
    {
      ...global.config.FCA_OPTIONS,

      enableAutoRefresh: true,
      listenEvents: true,
      selfListen: false,
      forceLogin: false,

      online: true,
      updatePresence: true,
      autoReconnect: true,

      ultraLowBanMode: true,
      enableHumanBehavior: true,
    }
  );
}

/* =======================
   UTILS
======================= */
function generateListenerID() {
  return Date.now() + crypto.randomBytes(4).toString("hex");
}

function getRandomPassword(len = 8) {
  return crypto.randomBytes(len).toString("hex").slice(0, len);
}

/* =======================
   RUN
======================= */
start();
