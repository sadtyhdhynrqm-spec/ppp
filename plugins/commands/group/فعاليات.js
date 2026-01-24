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
        "gameStart": "اللعبة {name} بدأت! أول واحد يجاوب صح ياخد ✅\n{clue}",
        "correct": "✅ صح! {user} كسب نقطة",
        "wrong": "❌ غلط!",
        "scores": "النقاط الحالية:\n{scores}",
        "noActiveGame": "ما في أي فعالية شغالة حاليا",
        "gameEnded": "الفعلية انتهت! الفائز: {winner} 🏆\nالنقاط النهائية:\n{scores}"
    }
};

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

let activeGame = null;
let listenerAdded = false;
let lastMessageID = null; // لتخزين رسالة اللعبة

async function onCall({ message, getLang, api }) {
    try {
        // عرض قائمة الألعاب لو ما في فعالية
        if (!activeGame) {
            const list = gamesList.map((g, i) => `${i + 1}. ${g.name}`).join("\n");
            const msg = await message.reply(getLang("chooseGame").replace("{list}", list));
            lastMessageID = msg.messageID; // نخزن ID الرسالة
        }

        if (!listenerAdded) {
            listenerAdded = true;
            api.listenMessage(async (event) => {
                if (!event.body) return;

                const msg = event.body.trim();

                // فقط الردود على رسالة البوت
                if (!event.messageReply || event.messageReply.messageID !== lastMessageID) return;

                // إنهاء اللعبة
                if (msg.toLowerCase() === "خلاص") {
                    if (!activeGame) return api.sendMessage(getLang("noActiveGame"), event.threadID);

                    let scoresEntries = Object.entries(activeGame.scores);
                    let winner = "لا أحد";
                    if (scoresEntries.length > 0) {
                        scoresEntries.sort((a, b) => b[1] - a[1]);
                        const topScore = scoresEntries[0][1];
                        const topPlayers = scoresEntries.filter(([id, pts]) => pts === topScore);
                        winner = topPlayers.map(([id]) => id).join(", ");
                    }
                    let scoresText = scoresEntries.map(([id, pts]) => `${id}: ${pts} نقطة`).join("\n") || "لا أحد كسب نقاط";
                    api.sendMessage(getLang("gameEnded").replace("{winner}", winner).replace("{scores}", scoresText), event.threadID);
                    activeGame = null;
                    return;
                }

                // اختيار اللعبة لو ما في فعالية
                if (!activeGame) {
                    const choice = parseInt(msg);
                    if (!isNaN(choice) && choice >= 1 && choice <= gamesList.length) {
                        const game = gamesList[choice - 1];
                        activeGame = { game, scores: {} };
                        const startMsg = await api.sendMessage(getLang("gameStart").replace("{name}", game.name).replace("{clue}", game.clue), event.threadID);
                        lastMessageID = startMsg.messageID; // نخزن رسالة بدء اللعبة
                    } else {
                        api.sendMessage(getLang("invalidChoice"), event.threadID);
                    }
                    return;
                }

                // إذا في فعالية، تحقق من الإجابة
                const answer = msg.toLowerCase();
                if (answer === activeGame.game.answer.toLowerCase()) {
                    const userId = event.senderID;
                    activeGame.scores[userId] = (activeGame.scores[userId] || 0) + 1;
                    api.sendMessage(getLang("correct").replace("{user}", event.senderName), event.threadID);
                } else {
                    api.sendMessage(getLang("wrong"), event.threadID);
                }
            });
        }

    } catch (err) {
        console.error(err);
    }
}

export default { config, langData, onCall };
