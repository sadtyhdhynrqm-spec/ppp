export const config = {
  name: "زوجه",
  aliases: ["adminctl", "زوجة"],
  role: 2,
  credits: "سينكو",
  description: "لوحة تحكم أدمن البوت"
};

export async function onCall({
  message,
  args,
  commands,
  globalData,
  usersData
}) {

  // عرض القائمة المزخرفة
  if (!args[0]) {
    return message.reply(`
✿ ✿ ✿ ─────── ✿ ✿ ✿
        لوحة تحكم أدمن البوت
              「 زوجه 」
✿ ✿ ✿ ─────── ✿ ✿ ✿

╭─❀ الاستخدام ❀─╮
│
│ ✿ زوجه admin <منشن>
│   ↳ إضافة أدمن بوت
│
│ ✿ زوجه setrole <أمر> <0|1|2>
│   ↳ تغيير صلاحية أمر
│
│ ✿ زوجه setalias <أمر> <اسم>
│   ↳ إضافة اسم بديل
│
│ ✿ زوجه cmd reload
│   ↳ إعادة تحميل الأوامر
│
│ ✿ زوجه setlang <لغة>
│   ↳ تغيير لغة البوت
│
│ ✿ زوجه adminonly
│   ↳ قفل / فتح البوت على الأدمن
│
│ ✿ زوجه unsend
│   ↳ حذف رسالة البوت (بالرد)
│
╰─❀ مثال ❀─╯
✿ زوجه setrole help 1

✿ ✿ ✿ ─────── ✿ ✿ ✿
    `);
  }

  const sub = args[0].toLowerCase();

  // ───────── admin
  if (sub === "admin") {
    const uid = Object.keys(message.mentions || {})[0];
    if (!uid) return message.reply("❌ منشن الشخص");

    await usersData.set(uid, { isAdmin: true }, { merge: true });
    return message.reply("✓ تم إضافة أدمن بوت");
  }

  // ───────── setrole
  if (sub === "setrole") {
    const [, cmdName, role] = args;
    const cmd = commands.get(cmdName);

    if (!cmd) return message.reply("❌ الأمر غير موجود");
    if (cmdName === "زوجه") return message.reply("❌ لا يمكن تعديل هذا الأمر");

    const roleNum = Number(role);
    if (![0, 1, 2].includes(roleNum))
      return message.reply("❌ الصلاحية يجب أن تكون 0 أو 1 أو 2");

    cmd.config.role = roleNum;
    return message.reply(`✓ تم تغيير صلاحية ${cmdName} إلى ${roleNum}`);
  }

  // ───────── setalias
  if (sub === "setalias") {
    const [, cmdName, alias] = args;
    const cmd = commands.get(cmdName);

    if (!cmd) return message.reply("❌ الأمر غير موجود");
    if (!alias) return message.reply("❌ اكتب الاسم البديل");

    cmd.config.aliases ??= [];
    if (cmd.config.aliases.includes(alias))
      return message.reply("⚠️ الاسم موجود مسبقاً");

    cmd.config.aliases.push(alias);
    return message.reply("✓ تم إضافة الاسم البديل");
  }

  // ───────── cmd reload
  if (sub === "cmd" && args[1] === "reload") {
    return message.reply("✓ تم إعادة تحميل الأوامر");
  }

  // ───────── setlang
  if (sub === "setlang") {
    if (!args[1]) return message.reply("❌ حدد اللغة");

    await globalData.set("LANGUAGE", args[1]);
    return message.reply(`✓ تم تغيير اللغة إلى ${args[1]}`);
  }

  // ───────── adminonly
  if (sub === "adminonly") {
    const status = (await globalData.get("ADMIN_ONLY")) ?? false;
    await globalData.set("ADMIN_ONLY", !status);

    return message.reply(
      `وضع الأدمن فقط: ${!status ? "مفعل" : "مغلق"}`
    );
  }

  // ───────── unsend
  if (sub === "unsend") {
    const reply = message.reply_message || message.messageReply;
    if (!reply) return message.reply("❌ رد على رسالة البوت");

    return message.unsend(reply.messageID);
  }

  return message.reply("❌ خيار غير معروف، اكتب: زوجه");
}
