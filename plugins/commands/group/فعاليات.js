const config = {
    name: "فعاليات",
    description: "لعبة فعاليات أنمي مستمرة حتى أمر الخلاص",
    usage: "[رقم اللعبة أو 'خلاص']",
    cooldown: 3,
    permissions: [0, 1, 2],
    credits: "ᏕᎥᏁᎨᎧ"
};

const langData = {
    "ar_SY": {
        "chooseGame": "دي قائمة الفعاليات الأنمي:\n{list}\nرد بالرقم عشان تختار اللعبة",
        "invalidChoice": "رقم غير صالح حاول مرة تانية",
        "gameStart": "اللعبة {name} بدأت! أول واحد يجاوب صح ياخد ✅",
        "correct": "✅ صح! {user} كسب نقطة",
        "wrong": "❌ غلط!",
        "scores": "النقاط الحالية:\n{scores}",
        "noActiveGame": "ما في أي فعالية شغالة حاليا",
        "gameEnded": "الفعلية انتهت! الفائز: {winner} 🏆\nالنقاط النهائية:\n{scores}"
    }
};

// 10 ألعاب أنمي
const gamesList = [
    { name: "تخمين شخصية أنمي", clue: "شخصية شعر أصفر ومعلّم يوزوكا", answer: "نينجا ناروتو" },
    { name: "لون الشعر", clue: "ما هو لون شعر لينك؟", answer: "أشقر" },
    { name: "الأنمي الغامض", clue: "فتى يحارب شياطين لإنقاذ عائلته", answer: "قاتل الشياطين" },
    { name: "شخصية من الصوت", clue: "صوته عالي ونبرته مليانة طاقة", answer: "غوكو" },
    { name: "حركة مشهورة", clue: "قفزة الطاقة", answer: "قفزة الطاقة" },
    { name: "رمز الأنمي", clue: "رمز الجدار الشهير", answer: "هجوم العمالقة" },
    { name: "عدد الحلقات", clue: "كم عدد حلقات وان بيس؟", answer: "1000" },
    { name: "السلاح المفضل", clue: "ما هو السلاح المفضل لليفي؟", answer: "سيف مزدوج" },
    { name: "القدرة الخاصة", clue: "ما هي القدرة الخاصة لساتسوكي؟", answer: "هاكي" },
    { name: "مقولة مشهورة", clue: "من لا يستطيع القتال ليس له مكان في الجيش", answer: "ليفي" }
];

// المتغيرات لتخزين الفعالية الحالية ونقاط الأعضاء
let activeGame = null;
let listenerAdded = false;

async function onCall({ message, args, getLang, api }) {
    try {
        // أمر إنهاء الفعالية (فقط للأدمن)
        if (args[0] && args[0].toLowerCase() === "خلاص") {
            if (!activeGame) return message.reply(getLang("noActiveGame"));

            // حساب الفائز
            let scoresEntries = Object.entries(activeGame.scores);
            let winner = "لا أحد";
            if (scoresEntries.length > 0) {
                scoresEntries.sort((a, b) => b[1] - a[1]); // ترتيب تنازلي
                const topScore = scoresEntries[0][1];
                const topPlayers = scoresEntries.filter(([id, pts]) => pts === topScore);
                winner = topPlayers.map(([id]) => id).join(", "); // ممكن يكون أكثر من فائز
            }

            // عرض النقاط النهائية والفائز
            let scoresText = scoresEntries.map(([id, pts]) => `${id}: ${pts} نقطة`).join("\n") || "لا أحد كسب نقاط";
            api.sendMessage(
                getLang("gameEnded")
                    .replace("{winner}", winner)
                    .replace("{scores}", scoresText),
                message.threadID
            );
            activeGame = null; // مسح الفعالية
            return;
        }

        // إذا لم يكن هناك فعالية حالياً، عرض قائمة الألعاب
        if (!activeGame) {
            const list = gamesList.map((g, i) => `${i + 1}. ${g.name}`).join("\n");
            return message.reply(getLang("chooseGame").replace("{list}", list));
        }

        // اختيار اللعبة إذا لم يكن هناك فعالية
        if (!args[0]) return;

        const choice = parseInt(args[0]);
        if (isNaN(choice) || choice < 1 || choice > gamesList.length)
            return message.reply(getLang("invalidChoice"));

        const game = gamesList[choice - 1];
        activeGame = {
            game,
            scores: {}
        };

        // بدء اللعبة
        message.reply(getLang("gameStart").replace("{name}", game.name) + `\n${game.clue}`);

        // إضافة Listener مرة واحدة فقط لكل البوت للردود بدون بادئة
        if (!listenerAdded) {
            listenerAdded = true;
            api.listenMessage(async (event) => {
                if (!activeGame) return;
                if (!event.body) return;

                const answer = event.body.toLowerCase();
                if (answer === activeGame.game.answer.toLowerCase()) {
                    const userId = event.senderID;
                    activeGame.scores[userId] = (activeGame.scores[userId] || 0) + 1;
                    api.sendMessage(getLang("correct").replace("{user}", event.senderName), event.threadID);
                    // الفعالية لا تنتهي إلا بالأمر 'خلاص'
                } else {
                    api.sendMessage(getLang("wrong"), event.threadID);
                }
            });
        }

    } catch (err) {
        console.error(err);
    }
}

export default {
    config,
    langData,
    onCall
};
