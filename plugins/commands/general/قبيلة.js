import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

/* ================= FIX DIRNAME ================= */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ================= CONFIG ================= */
const config = {
    name: "قبيلة",
    description: "نظام قبائل وتجاره جاهلية ممتع 🔥",
    usage: "قبيلة | قبيلة خمر | قبيلة مجلس | قبيلة خيمة | قبيلة جارية | قبيلة جواري | قبيلة دعوة",
    cooldown: 5,
    permissions: [0],
    credits: "🔥 Whisky x Gemini",
};

/* ================= LANG ================= */
const langData = {
    ar_SY: {
        notGroup: "❌ هذا الأمر يعمل داخل المجموعات فقط",
        error: "❌ حصل خطأ غير متوقع",
    },
};

/* ================= DATA ================= */
const dataPath = path.join(__dirname, "tribal_data.json");

const WINE_TYPES = {
    عادي: { price: 10000, profit: 1.3, time: 2, emoji: "🏺" },
    قديم: { price: 20000, profit: 1.7, time: 4, emoji: "🍷" },
    فاخر: { price: 35000, profit: 2.4, time: 6, emoji: "🍾" },
};

const SLAVES = {
    1: { price: 50000, profit: 1.2, emoji: "🧕" },
    2: { price: 120000, profit: 1.6, emoji: "👸" },
    3: { price: 250000, profit: 2.3, emoji: "👑" },
};

/* ================= HELPERS ================= */
function loadData() {
    if (!fs.existsSync(dataPath)) fs.writeFileSync(dataPath, "{}");
    return JSON.parse(fs.readFileSync(dataPath));
}

function saveData(data) {
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
}

function initUser(id, data) {
    if (!data[id]) {
        data[id] = {
            gold: 300000,
            wine: { stock: {}, fermenting: [] },
            slaves: [],
            stats: { earnings: 0 },
            lastInvite: 0,
        };
    }
    return data[id];
}

const rand = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const fmt = (n) => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

/* ================= FEATURES ================= */

// 🍷 صناعة خمر
async function makeWine(uid, amount, type, data, message) {
    if (!amount || !type)
        return message.reply("❌ الاستخدام: قبيلة خمر <الكمية> <النوع>");

    const user = initUser(uid, data);
    const wine = WINE_TYPES[type];
    if (!wine) return message.reply("❌ النوع: عادي | قديم | فاخر");

    const cost = wine.price * amount;
    if (user.gold < cost) return message.reply("💰 ذهبك ما يكفي");

    user.gold -= cost;
    user.wine.fermenting.push({
        type,
        amount,
        ready: Date.now() + wine.time * 3600000,
    });

    saveData(data);
    message.reply(`${wine.emoji} بدأت تخمير ${amount} خمر ${type}`);
}

// 🏺 فتح مجلس
async function openMajlis(uid, data, message) {
    const user = initUser(uid, data);
    const now = Date.now();

    user.wine.fermenting = user.wine.fermenting.filter((w) => {
        if (w.ready <= now) {
            user.wine.stock[w.type] =
                (user.wine.stock[w.type] || 0) + w.amount;
            return false;
        }
        return true;
    });

    let profit = 0;
    for (const t in user.wine.stock) {
        const sell = rand(5, 20);
        if (user.wine.stock[t] >= sell) {
            profit += sell * WINE_TYPES[t].price * WINE_TYPES[t].profit;
            user.wine.stock[t] -= sell;
        }
    }

    profit = Math.floor(profit * 0.85);
    user.gold += profit;
    user.stats.earnings += profit;

    saveData(data);
    message.reply(`🍷 المجلس اشتغل\n💰 الربح: ${fmt(profit)}`);
}

// 🧕 شراء جارية
async function buySlave(uid, lvl, data, message) {
    if (!lvl)
        return message.reply("❌ الاستخدام: قبيلة جارية <1|2|3>");

    const user = initUser(uid, data);
    const s = SLAVES[lvl];
    if (!s) return message.reply("❌ المستوى 1 أو 2 أو 3");

    if (user.gold < s.price) return message.reply("💰 ما عندك ذهب");

    user.gold -= s.price;
    user.slaves.push({ level: lvl });

    saveData(data);
    message.reply(`${s.emoji} اشتريت جارية مستوى ${lvl}`);
}

// 🔥 تشغيل الخيمة
async function openTent(uid, data, message) {
    const user = initUser(uid, data);
    if (!user.slaves.length)
        return message.reply("❌ ما عندك جواري");

    let profit = 0;
    user.slaves.forEach(
        (s) => (profit += rand(5, 15) * SLAVES[s.level].profit * 1000)
    );

    profit = Math.floor(profit * 0.9);
    user.gold += profit;
    user.stats.earnings += profit;

    saveData(data);
    message.reply(`🔥 الخيمة اشتغلت\n💰 الربح: ${fmt(profit)}`);
}

// 📋 عرض الجواري
async function listSlaves(uid, data, message) {
    const user = initUser(uid, data);
    if (!user.slaves.length)
        return message.reply("❌ ما عندك جواري");

    let txt = "🧕 جواريك:\n";
    user.slaves.forEach(
        (s, i) =>
            (txt += `#${i + 1} مستوى ${s.level} ${SLAVES[s.level].emoji}\n`)
    );
    message.reply(txt);
}

// 🎉 دعوة
async function invite(uid, data, message) {
    const user = initUser(uid, data);
    if (Date.now() - user.lastInvite < 4 * 60 * 60 * 1000)
        return message.reply("⏳ انتظر 4 ساعات قبل الدعوة");

    user.lastInvite = Date.now();
    const profit = rand(20000, 60000);

    user.gold += profit;
    user.stats.earnings += profit;

    saveData(data);
    message.reply(`🎉 تمت الدعوة\n💰 ربح: ${fmt(profit)}`);
}

// 📊 الحالة
async function showStats(uid, data, message) {
    const user = initUser(uid, data);
    message.reply(
        `🏜️ قبيلتك\n💰 الذهب: ${fmt(user.gold)}\n📊 الأرباح: ${fmt(
            user.stats.earnings
        )}`
    );
}

/* ================= MAIN ================= */
async function onCall({ message, getLang }) {
    try {
        if (!message.isGroup)
            return message.reply(getLang("notGroup"));

        const { senderID, args } = message;
        const data = loadData();
        const sub = args[0];

        switch (sub) {
            case "خمر":
                return makeWine(
                    senderID,
                    parseInt(args[1]),
                    args[2],
                    data,
                    message
                );
            case "مجلس":
                return openMajlis(senderID, data, message);
            case "جارية":
                return buySlave(senderID, parseInt(args[1]), data, message);
            case "جواري":
                return listSlaves(senderID, data, message);
            case "خيمة":
                return openTent(senderID, data, message);
            case "دعوة":
                return invite(senderID, data, message);
            default:
                return showStats(senderID, data, message);
        }
    } catch (e) {
        console.error(e);
        message.reply(getLang("error"));
    }
}

/* ================= EXPORT ================= */
export default {
    config,
    langData,
    onCall,
};
