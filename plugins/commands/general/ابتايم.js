const config = {
    name: "ابتايم",
    aliases: ["upt"],
    credits: "XaviaTeam"
}

// دالة لتحويل الملي ثانية إلى ساعة:دقيقة:ثانية
function msToHMS(ms) {
    let sec = Math.floor(ms / 1000);
    let hrs = Math.floor(sec / 3600);
    sec %= 3600;
    let min = Math.floor(sec / 60);
    sec %= 60;
    return `${hrs}h ${min}m ${sec}s`;
}

function onCall({ message, client }) {
    // مدة التشغيل
    let uptime = msToHMS(process.uptime() * 1000);

    // عدد المجموعات (لو client فيه خاصية groups أو chats)
    let totalGroups = client?.groups?.length || 0;

    // حالة النظام
    let systemStatus = client?.ready ? "🟢 متصل" : "🟡 ضعيف";

    // الرسالة المزخرفة والجذابة
    let replyMsg = `
❖━═━❖⊱ 𝐊𝐈𝐅𝐀𝐍 𝑩𝑶𝑻 ⊰❖━═━❖

⏳  ➤ مدة التشغيل  : ${uptime}
👥  ➤ عدد المجموعات : ${totalGroups}
⚡  ➤ حالة النظام   : ${systemStatus}

❖━═━❖⊱ 𝐊𝐈𝐅𝐀𝐍 𝑻𝑬𝑨𝑴 ⊰❖━═━❖
`;

    message.reply(replyMsg);
}

export default {
    config,
    onCall
        }
