import axios from 'axios';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const cachePath = path.resolve(__dirname, '../cache');

const config = {
    name: "تخيل",
    version: "1.0.0",
    permissions: 0,
    credits: "@jm",
    description: "gen a img using pollinations api",
    usage: "[prompt]",
    cooldown: 3,
    category: "Images",
};

async function onCall({ message, args, data }) {
    const prefix = data?.thread?.data?.prefix || global.config.PREFIX; // Get the prefix from thread data or global config

    if (args.length === 0) {
        return message.reply(`Please provide a prompt for the image generation`);
    }

    const prompt = args.join(" ");
    message.reply("⏳ يتم انشاء صورتك...");

    try {
        const response = await axios.get(`https://rapido.zetsu.xyz/api/pollinations?prompt=${encodeURIComponent(prompt)}`, {
            responseType: 'arraybuffer'
        });

        if (response.status !== 200) {
            return message.reply("An error occurred.");
        }

        const imgBuffer = Buffer.from(response.data, 'binary');
        await fs.ensureDir(cachePath);
        const filePath = path.join(cachePath, `poli_${Date.now()}.png`);
        await fs.outputFile(filePath, imgBuffer);

        await message.reply({
            body: prompt,
            attachment: fs.createReadStream(filePath)
        });
    } catch (error) {
        console.error("Error in command:", error);
        message.reply("An error occurred.");
    }
}

export default {
    config,
    onCall
};
