import * as os from "node:os";

const config = {
    name: "ابتايم ",
    aliases: ["upt", "status", "sys"],
    credits: "XaviaTeam"
};

// دالة تحويل الوقت (بديل آمن)
function msToHMS(ms) {
    const s = Math.floor(ms / 1000);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h}h ${m}m ${sec}s`;
}

async function onCall({ message }) {
    try {
        const loadingMsg = await message.reply("⏳ Getting uptime information...");

        const start = Date.now();

        const uptime = msToHMS(process.uptime() * 1000);

        const totalRam = (os.totalmem() / 1024 ** 3).toFixed(2);
        const usedRam = ((os.totalmem() - os.freemem()) / 1024 ** 3).toFixed(2);

        const cpu = os.cpus();
        const cpuModel = cpu[0]?.model || "Unknown";
        const cpuCores = cpu.length;

        const platform = os.platform();
        const nodeVersion = process.version;

        const ping = Date.now() - start;

        const text = `
╭─── ⏳ SYSTEM UPTIME ───╮
│
│ ⏱️ Uptime   : ${uptime}
│ 📡 Ping     : ${ping} ms
│
│ 💾 RAM Used : ${usedRam} GB
│ 💾 RAM Max  : ${totalRam} GB
│
│ ⚙️ CPU      : ${cpuModel}
│ ⚙️ Cores    : ${cpuCores}
│
│ 🧠 OS       : ${platform}
│ 🟢 Node.js  : ${nodeVersion}
│
╰─────────── ✦ ───────────╯
        `.trim();

        await loadingMsg.edit(text);
    } catch (err) {
        console.error("Uptime command error:", err);
        await message.reply("❌ حصل خطأ أثناء تنفيذ الأمر.");
    }
}

export default {
    config,
    onCall
};
