import fs from "fs";
import path from "path";

let currentPath = process.cwd(); // يبدأ من مجلد التشغيل

const config = {
    name: "shell",
    aliases: ["shell", "terminal"],
    description: "أوامر إدارة الملفات: ls, cd, mkdir, create, write, get, delete",
    usage: "<الأمر> <المحتوى>",
    credits: "Ꮥ.ᎥᏁᎨᎧᎯᏴᎨᏟᎻᎥᎯᎶ" 
};

async function onCall({ message, args }) {

    // 🔐 حماية الأمر لمستخدم واحد فقط
    if (message.senderID !== "61586897962846") {
        return message.reply("🚫 ليس لديك صلاحية استخدام هذا الأمر.");
    }

    const subCommand = args[0];
    const input = args.slice(1).join(" ");

    switch (subCommand) {

        case "ls": {
            try {
                const files = fs.readdirSync(currentPath);
                return message.reply(`📁 محتويات المجلد الحالي:\n${files.join("\n")}`);
            } catch {
                return message.reply("❌ حدث خطأ أثناء قراءة المجلد.");
            }
        }

        case "cd": {
            const target = path.resolve(currentPath, input);
            if (fs.existsSync(target) && fs.statSync(target).isDirectory()) {
                currentPath = target;
                return message.reply(`✅ تم الانتقال إلى:\n${currentPath}`);
            }
            return message.reply("❌ المجلد غير موجود أو غير صالح.");
        }

        case "mkdir": {
            const dirPath = path.join(currentPath, input);
            if (!fs.existsSync(dirPath)) {
                fs.mkdirSync(dirPath);
                return message.reply(`📁 تم إنشاء المجلد:\n${dirPath}`);
            }
            return message.reply("⚠️ المجلد موجود بالفعل.");
        }

        case "create": {
            const [fileName, ...codeParts] = input.split("+");
            const filePath = path.join(currentPath, fileName.trim());
            const code = codeParts.join("+").trim();

            try {
                fs.writeFileSync(filePath, code || "", "utf8");
                return message.reply(`📝 تم إنشاء الملف:\n${fileName.trim()}`);
            } catch {
                return message.reply("❌ فشل في إنشاء الملف.");
            }
        }

        case "write": {
            const [fileName, ...codeParts] = input.split("+");
            const filePath = path.join(currentPath, fileName.trim());
            const code = codeParts.join("+").trim();

            if (!fs.existsSync(filePath)) {
                return message.reply("❌ الملف غير موجود.");
            }

            fs.writeFileSync(filePath, code, "utf8");
            return message.reply(`✏️ تم تعديل الملف:\n${fileName.trim()}`);
        }

        case "get": {
            const filePath = path.join(currentPath, input.trim());
            if (!fs.existsSync(filePath)) {
                return message.reply("❌ الملف غير موجود.");
            }

            const ext = path.extname(filePath).toLowerCase();
            if ([".png", ".jpg", ".jpeg"].includes(ext)) {
                return message.reply({
                    attachment: fs.createReadStream(filePath)
                });
            }

            const content = fs.readFileSync(filePath, "utf8");
            return message.reply(`📄 محتوى ${input}:\n\n${content}`);
        }

        case "delete": {
            const targetPath = path.join(currentPath, input.trim());
            if (!fs.existsSync(targetPath)) {
                return message.reply("❌ الملف أو المجلد غير موجود.");
            }

            try {
                const stats = fs.statSync(targetPath);
                if (stats.isDirectory()) {
                    fs.rmSync(targetPath, { recursive: true, force: true });
                    return message.reply(`🗂️ تم حذف المجلد:\n${input.trim()}`);
                } else {
                    fs.unlinkSync(targetPath);
                    return message.reply(`🗑️ تم حذف الملف:\n${input.trim()}`);
                }
            } catch {
                return message.reply("⚠️ حدث خطأ أثناء الحذف.");
            }
        }

        default:
            return message.reply(
                "❓ الأمر غير معروف. استخدم: ls, cd, mkdir, create, write, get, delete"
            );
    }
}

export default {
    config,
    onCall
};
