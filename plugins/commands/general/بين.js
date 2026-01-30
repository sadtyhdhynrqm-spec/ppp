import axios from "axios";

const config = {
    name: "بين",
    aliases: ["pin", "pint", "بن", "pinterest", "صور"],
    description: "البحث عن صور من Pinterest",
    usage: "<كلمة البحث> [عدد الصور]",
    category: "بحث",
    cooldown: 5,
    permissions: [0, 1, 2],
    credits: "XaviaTeam"
};

async function onCall({ message, args }) {
    try {
        if (!args.length)
            return message.reply("⚠️ اكتب كلمة البحث\n\n📝 مثال: بين cat 5");

        let count = 6;
        const lastArg = args[args.length - 1];
        if (!isNaN(lastArg)) {
            count = Math.min(parseInt(lastArg), 20);
            args.pop();
        }

        const query = args.join(" ");
        await message.reply(`🔍 جاري البحث عن: ${query} ...`);

        const params = {
            data: JSON.stringify({
                options: {
                    query,
                    scope: "pins",
                    page_size: 200
                },
                context: {}
            }),
            _: Date.now()
        };

        const { data } = await axios.get(
            "https://www.pinterest.com/resource/BaseSearchResource/get/",
            {
                params,
                headers: {
                    "User-Agent": "Mozilla/5.0",
                    "Accept": "application/json"
                }
            }
        );

        const json = JSON.stringify(data);
        const regex = /https:\/\/i\.pinimg\.com\/(736|1200)x\/[^"]+\.(jpg|png|webp)/gi;
        const images = [...new Set(json.match(regex))];

        if (!images || images.length === 0)
            return message.reply(`❌ ما لقيت صور لـ "${query}"`);

        const selected = images.slice(0, count);
        const attachments = [];

        for (const url of selected) {
            try {
                attachments.push(await global.getStream(url));
            } catch {}
        }

        if (!attachments.length)
            return message.reply("⚠️ فشل تحميل الصور");

        return message.reply({
            body: `✅ تم العثور على ${attachments.length} صورة لـ "${query}"`,
            attachment: attachments
        });

    } catch (err) {
        console.error(err);
        return message.reply("❌ حصل خطأ أثناء البحث");
    }
}

export default {
    config,
    onCall
};
