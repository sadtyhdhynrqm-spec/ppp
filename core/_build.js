import "../cleanup.js";
import {} from "dotenv/config";
import { writeFileSync } from "fs";
import { resolve as resolvePath } from "path";
import logger from "./var/modules/logger.js";
import login from "rapido-fca";
import startServer from "./dashboard/server/app.js";
import handleListen from "./handlers/listen.js";
import environments from "./var/modules/environments.get.js";
import _init_var from "./var/_init.js";
import replitDB from "@replit/database";
import { execSync } from "child_process";
import { initDatabase, updateJSON, updateMONGO, _Threads, _Users } from "./handlers/database.js";
import crypto from "crypto";

const { isGlitch, isReplit } = environments;

process.stdout.write(String.fromCharCode(27) + "]0;" + "Xavia" + String.fromCharCode(7));

process.on("unhandledRejection", (reason, p) => {
    console.error(reason, "Unhandled Rejection at Promise", p);
});

process.on("uncaughtException", (err, origin) => {
    logger.error("Uncaught Exception: " + err + ": " + origin);
});

process.on("SIGINT", shutdownBot);
process.on("SIGTERM", shutdownBot);
process.on("SIGHUP", shutdownBot);

async function start() {
    try {
        await _init_var();
        logger.system(getLang("build.start.varLoaded"));
        await initDatabase();

        // نخزن فقط البيانات الأساسية لكل Thread و User لتقليل الرام
        global.controllers = {
            Threads: { get: _Threads.get, set: _Threads.set, fetchBasic: fetchBasicThreadData },
            Users: { get: _Users.get, set: _Users.set, fetchBasic: fetchBasicUserData }
        };

        const serverAdminPassword = getRandomPassword(8);
        startServer(serverAdminPassword);
        process.env.SERVER_ADMIN_PASSWORD = serverAdminPassword;

        await booting(logger);
    } catch (err) {
        logger.error(err);
        shutdownBot();
    }
}

global.listenerID = null;

function booting(logger) {
    return new Promise((resolve, reject) => {
        logger.custom(getLang("build.booting.logging"), "LOGIN");

        loginState()
            .then(async (api) => {
                global.api = api;
                global.botID = api.getCurrentUserID();
                logger.custom(getLang("build.booting.logged", { botID }), "LOGIN");

                refreshState(); // تحديث AppState بشكل اقتصادي
                if (global.config.REFRESH) autoReloadApplication();

                const newListenerID = generateListenerID();
                global.listenerID = newListenerID;
                global.listenMqtt = api.listenMqtt(await handleListen(newListenerID));

                resolve();
            })
            .catch((err) => {
                if (isGlitch && global.isExists(resolvePath(process.cwd(), ".data", "appstate.json"), "file")) {
                    global.deleteFile(resolvePath(process.cwd(), ".data", "appstate.json"));
                    execSync("refresh");
                }
                reject(err);
            });
    });
}

// تحديث AppState بدون تخزين نسخة كبيرة في الرام
const _12HOUR = 1000 * 60 * 60 * 12;
function refreshState() {
    global.refreshState = setInterval(async () => {
        logger.custom(getLang("build.refreshState"), "REFRESH");
        try {
            const newAppState = global.api.getAppState();
            if (global.config.APPSTATE_PROTECTION) {
                if (isGlitch) {
                    writeFileSync(resolvePath(process.cwd(), ".data", "appstate.json"), JSON.stringify(newAppState, null, 2), "utf-8");
                } else if (isReplit) {
                    const db = new replitDB();
                    const APPSTATE_SECRET_KEY = await db.get("APPSTATE_SECRET_KEY");
                    if (APPSTATE_SECRET_KEY) {
                        const encryptedAppState = global.modules.get("aes").encrypt(JSON.stringify(newAppState), APPSTATE_SECRET_KEY);
                        writeFileSync(resolvePath(global.config.APPSTATE_PATH), JSON.stringify(encryptedAppState), "utf8");
                    }
                }
            } else {
                writeFileSync(resolvePath(global.config.APPSTATE_PATH), JSON.stringify(newAppState, null, 2), "utf8");
            }
        } catch (err) {
            console.error("Error refreshing AppState:", err);
        }
    }, _12HOUR);
}

// Listener يبقى مستمر بدون إعادة إنشاء متكررة
const _6HOUR = 1000 * 60 * 60 * 6;
function refreshMqtt() {
    global.refreshMqtt = setInterval(async () => {
        logger.custom(getLang("build.refreshMqtt"), "REFRESH");
        const newListenerID = generateListenerID();
        global.listenMqtt.stopListening();
        global.listenerID = newListenerID;
        global.listenMqtt = global.api.listenMqtt(await handleListen(newListenerID));
    }, _6HOUR);
}

// توليد Listener ID
function generateListenerID() {
    return Date.now() + crypto.randomBytes(4).toString('hex');
}

// إعادة تشغيل تلقائي إذا REFRESH مفعل
function autoReloadApplication() {
    setTimeout(() => global.restart(), global.config.REFRESH);
}

function loginState() {
    const { APPSTATE_PATH, APPSTATE_PROTECTION, FCA_OPTIONS } = global.config;

    return new Promise((resolve, reject) => {
        global.modules.get("checkAppstate")(APPSTATE_PATH, APPSTATE_PROTECTION)
            .then((appState) => {
                login({ appState }, FCA_OPTIONS, (error, api) => {
                    if (error) return reject(error.error || error);
                    resolve(api);
                });
            })
            .catch(reject);
    });
}

function shutdownBot() {
    logger.system(getLang("build.start.exit"));
    if (global.refreshState) clearInterval(global.refreshState);
    if (global.refreshMqtt) clearInterval(global.refreshMqtt);
    if (global.listenMqtt) global.listenMqtt.stopListening();
    global.shutdown();
}

// ===========================
// دوال لتقليل حجم البيانات المخزنة في الرام
// ===========================
function fetchBasicThreadData(thread) {
    return { id: thread.id, settings: thread.settings };
}

function fetchBasicUserData(user) {
    return { id: user.id, info: user.info };
}

start();
