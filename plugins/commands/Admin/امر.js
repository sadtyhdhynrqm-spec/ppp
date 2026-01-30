mport fs from "fs";
import path from "path";

const config = {
  name: "امر",
  aliases: ["loadcmd", "addfile"],
  version: "1.0",
  description: "إضافة ملف أمر جديد للبوت",
  usage: "[اسم الملف.js]",
  credits: "Ꮥ.ᎥᏁᎨᎧᎯᏴᎨᏟᎻᎥᎯᎶᎯ"
};

async function onCall({ message, args}) {
  const fileName = args[0];
  if (!fileName ||!fileName.endsWith(".js")) {
    return message.reply("❌ لازم تكتب اسم ملف.js مثل: اضف بانبك.js");
}

  const filePath = path.join(global.mainPath, "plugins", "commands", fileName);
  if (!fs.existsSync(filePath)) {
    return message.reply(`❌ الملف ${fileName} غير موجود في مجلد الأوامر.`);
}

  try {
    delete require.cache[require.resolve(filePath)];
    const commandModule = require(filePath);

    if (!commandModule?.config ||!commandModule?.onCall) {
      return message.reply("⚠️ الملف ما فيه بنية أمر صحيحة (config و onCall).");
}

    global.plugins.commandsConfig.set(commandModule.config.name, {
...commandModule.config,
      onCall: commandModule.onCall
});

    message.reply(`✅ تم تحميل الأمر ${commandModule.config.name} بنجاح!`);
} catch (err) {
    console.error("❌ خطأ في تحميل الأمر:", err);
    message.reply("💥 حصل خطأ أثناء تحميل الملف:\n" + err.message);
}
}

export default {
  config,
  onCall
};
