const config = {
    name: "مساعدة",
    aliases: ["help", "اوامر"],
    description: "عرض قائمة أوامر البوت بشكل مفصل",
    usage: "",
    credits: "XaviaTeam"
}

async function onCall({ message, args, prefix, userPermissions }) {
    const { commandsConfig } = global.plugins;

    // لو طلب شرح أمر معيّن
    const commandName = args[0]?.toLowerCase();
    if (commandName) {
        const cmd = commandsConfig.get(commandName);
        if (!cmd || cmd.isHidden)
            return message.reply("❌ الأمر غير موجود");

        return message.reply(
`•◌────˚❀˚───◌ ────˚❀˚────◌
📌 اسم الأمر: ${cmd.name}
🔁 الأسماء البديلة: ${cmd.aliases?.join(", ") || "لا يوجد"}
📝 الوصف: ${cmd.description || "لا يوجد"}

🛠️ الاستخدام:
${prefix}${cmd.name} ${cmd.usage || ""}

📂 القسم: ${cmd.category}
⏱️ الإنتظار: ${cmd.cooldown || 3} ثواني
👤 المطوّر: ${cmd.credits || "غير معروف"}
•◌────˚❀˚───◌ ────˚❀˚────◌
`);
    }

    let adminCmds = [];
    let economyCmds = [];
    let entertainmentCmds = [];
    let generalCmds = [];
    let groupCmds = [];
    let mediaCmds = [];
    let nsfwCmds = [];

    for (const [key, cmd] of commandsConfig.entries()) {
        if (cmd.isHidden) continue;
        if (!cmd.permissions) cmd.permissions = [0,1,2];
        if (!cmd.permissions.some(p => userPermissions.includes(p))) continue;

        const name = cmd.name || key;
        const cat = (cmd.category || "").toLowerCase();

        if (cat.includes("admin") || cat.includes("المطور")) adminCmds.push(name);
        else if (cat.includes("economy") || cat.includes("اقتصاد")) economyCmds.push(name);
        else if (cat.includes("fun") || cat.includes("game") || cat.includes("ترفيه")) entertainmentCmds.push(name);
        else if (cat.includes("general") || cat.includes("عام")) generalCmds.push(name);
        else if (cat.includes("group") || cat.includes("المجموعه")) groupCmds.push(name);
        else if (cat.includes("media") || cat.includes("وسائط")) mediaCmds.push(name);
        else if (cat.includes("nsfw") || cat.includes("اباحي")) nsfwCmds.push(name);
    }

    const formatCmds = (arr) =>
        arr.length ? arr.map(c => `▣ ${c}`).join("  ") : "لا توجد أوامر";

    let total =
        adminCmds.length +
        economyCmds.length +
        entertainmentCmds.length +
        generalCmds.length +
        groupCmds.length +
        mediaCmds.length +
        nsfwCmds.length;

    let body =
`•◌───˚❀˚─◌─˚❀˚───◌
        ﹝-﹞ الـــــــبادئة
•◌───˚❀˚─◌─˚❀˚───◌

⌈  ADMIN ⌋
${formatCmds(adminCmds)}

•◌────˚❀˚───◌ ────˚❀˚────

⌈  ECONOMY ⌋
${formatCmds(economyCmds)}

•◌────˚❀˚───◌ ────˚❀˚────

⌈  ENTERTAINMENT ⌋
${formatCmds(entertainmentCmds)}

•◌────˚❀˚───◌ ────˚❀˚────

⌈ GENERAL ⌋
${formatCmds(generalCmds)}

•◌────˚❀˚───◌ ────˚❀˚────

⌈ GROUP ⌋
${formatCmds(groupCmds)}

•◌────˚❀˚───◌ ────˚❀˚────

⌈ MEDIA ⌋
${formatCmds(mediaCmds)}

•◌────˚❀˚───◌ ────˚❀˚────

⌈ NSFW ⌋
${formatCmds(nsfwCmds)}

•◌────˚❀˚───◌ ────˚❀˚───ـــــــــــــــــ─◌
⇒ 📊 المجموع: ${total} أمر
⇒ ℹ️ استخدم: ${prefix}[اسم_الأمر] لعرض التفاصيل
•◌────˚❀˚───◌ ────˚❀˚──ــــــــــــــــ──◌
`;

    const imageUrl = "https://i.ibb.co/cS6SjxcB/1768628585933.jpg";
    return message.reply({ body, attachment: await global.getStream(imageUrl) });
}

export default {
    config,
    onCall
  }
