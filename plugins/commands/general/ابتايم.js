import { createCanvas } from "canvas";
import fs from "fs";
import * as os from "node:os";
import path from "path";

const config = {
    name: "upt",
    aliases: ["up", "dashboard"],
    credits: "Azadx69x"
};

// دالة تنسيق الوقت
function formatTime(sec) {
    const d = Math.floor(sec / 86400);
    const h = Math.floor((sec % 86400) / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = Math.floor(sec % 60);
    return `${d}d ${h}h ${m}m ${s}s`;
}

async function onCall({ message }) {
    let filePath;
    try {
        const loadingMsg = await message.reply("⏳ Generating system status card...");

        const start = Date.now();

        const uptimeBot = formatTime(process.uptime());
        const uptimeSystem = formatTime(os.uptime());

        const totalMem = os.totalmem() / 1024 / 1024;
        const freeMem = os.freemem() / 1024 / 1024;
        const usedMem = totalMem - freeMem;
        const ramPercent = ((usedMem / totalMem) * 100).toFixed(1);

        const cpuModel = os.cpus()[0]?.model || "Unknown";
        const cores = os.cpus().length;
        const platform = `${os.platform()} (${os.arch()})`;
        const hostname = os.hostname();
        const nodeVersion = process.version;
        const botMemory = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1);

        const ping = Date.now() - start;

        // ===== Canvas =====
        const width = 600;
        const height = 460;
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext("2d");

        ctx.fillStyle = "#0c1420";
        ctx.fillRect(0, 0, width, height);

        const cardX = 30;
        const cardY = 60;
        const cardWidth = width - 60;
        const cardHeight = height - 100;

        ctx.fillStyle = "#1a1f2b";
        ctx.shadowColor = "#00bfff";
        ctx.shadowBlur = 20;
        ctx.fillRect(cardX, cardY, cardWidth, cardHeight);
        ctx.shadowBlur = 0;

        ctx.fillStyle = "#00bfff";
        ctx.font = "22px Sans";
        ctx.fillText("SYSTEM STATUS", 40, 40);

        const labels = [
            "Bot Uptime",
            "System Uptime",
            "CPU",
            "RAM",
            "Platform",
            "Node.js",
            "Host",
            "Ping",
            "Bot Memory"
        ];

        const values = [
            uptimeBot,
            uptimeSystem,
            `${cpuModel} (${cores} cores)`,
            `${usedMem.toFixed(0)} / ${totalMem.toFixed(0)} MB`,
            platform,
            nodeVersion,
            hostname,
            `${ping} ms`,
            `${botMemory} MB`
        ];

        ctx.font = "15px Sans";
        labels.forEach((label, i) => {
            ctx.fillStyle = "#00ffff";
            ctx.fillText(label, cardX + 20, cardY + 40 + i * 30);

            ctx.fillStyle = "#ffffff";
            ctx.fillText(values[i], cardX + 180, cardY + 40 + i * 30);
        });

        // RAM Circle
        const centerX = cardX + cardWidth - 70;
        const centerY = cardY + 60;
        const radius = 45;

        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.strokeStyle = "#111";
        ctx.lineWidth = 7;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(
            centerX,
            centerY,
            radius,
            -Math.PI / 2,
            -Math.PI / 2 + (2 * Math.PI * ramPercent) / 100
        );
        ctx.strokeStyle = "#00ffff";
        ctx.lineWidth = 7;
        ctx.stroke();

        ctx.fillStyle = "#00ffff";
        ctx.font = "14px Sans";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(`${ramPercent}%`, centerX, centerY);

        ctx.textAlign = "center";
        ctx.fillStyle = "#00ffff";
        ctx.font = "16px Sans";
        ctx.fillText("Bot is running smoothly 🚀", width / 2, height - 20);

        const buffer = canvas.toBuffer("image/png");
        filePath = path.join(process.cwd(), "uptime_status.png");
        await fs.promises.writeFile(filePath, buffer);

        await loadingMsg.edit({
            body: "✅ **System status ready**",
            attachment: fs.createReadStream(filePath)
        });

        fs.unlinkSync(filePath);
    } catch (err) {
        console.error("Uptime image command error:", err);
        if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
        await message.reply("❌ حصل خطأ أثناء إنشاء كرت الحالة.");
    }
}

export default {
    config,
    onCall
};
