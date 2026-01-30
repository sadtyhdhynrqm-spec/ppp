/**
 * @تحسين وتطوير: Ꮥ.ᎥᏁᎨᎧᎯᏴᎨᏟᎻᎥᎯᎶᎯ
 * @النسخة: V7.0.0 [ULTRA]
 * @الوصف: كود عرض معلومات المطور والبوت بتنسيق فخم مع صورة
 */

import axios from "axios";

const config = {
    name: "المطور",
    description: "عرض معلومات مطور نظام ڪايࢪوس",
    usage: "المطور",
    cooldown: 5,
    permissions: [0],
    credits: "Ꮥ.ᎥᏁᎨᎧᎯᏴᎨᏟᎻᎥᎯᎶᎯ",
};

const langData = {
    ar_SY: {
        info: `✧ الـــــــــﻤطوࢪ | Ꮥ.ᎥᏁᎨᎧ ✧

⊹ الــبادئة: [-]
⊹ الــــــمطوࢪ: Ꮥ.ᎥᏁᎨᎧᎯᏴᎨᏟᎻᎥᎯᎶᎯ

⊹ الـعـمـر: 17

⊹ الـتـواصـل الـرسـمـي:
فـيـسـبـوك:
https://www.facebook.com/profile.php?id=61586897962846

━━━━━━━━━━━━━━━━━━
•◌────˚❀˚── ────˚❀˚────◌
عٌٌـلََآقُُـتٌٌـيََ بًًـآلََـنِِـآسِِ کْـأوٌٌرآقُُ آلََـشُُـجّّـر  
مًًـنِِ يََـبًًـقُُـﮯ يََـثًًـمًًـر  
وٌٌمًًـنِِ يََـسِِـقُُـطِِ لََـآ يََـعٌٌـوٌٌدٍٍ 🖤🦋🥀🖤🎶🥀
─── ･ ｡ﾟ☆: *.............* :☆ﾟ. ───
𝐌𝐘 𝐑𝐄𝐋𝐀𝐓𝐈𝐎𝐍𝐒𝐇𝐈𝐏 𝐖𝐈𝐓𝐇 𝐏𝐄𝐎𝐏𝐋𝐄 𝐈𝐒 𝐋𝐈𝐊𝐄 𝐓𝐇𝐄 𝐋𝐄𝐀𝐕𝐄𝐒 𝐎𝐅 𝐀 𝐓𝐑𝐄𝐄.  
𝐓𝐇𝐎𝐒𝐄 𝐖𝐇𝐎 𝐑𝐄𝐌𝐀𝐈𝐍 𝐁𝐄𝐀𝐑 𝐅𝐑𝐔𝐈𝐓,  
𝐀𝐍𝐃 𝐓𝐇𝐎𝐒𝐄 𝐖𝐇𝐎 𝐅𝐀𝐋𝐋 𝐃𝐎 𝐍𝐎𝐓 𝐑𝐄𝐓𝐔𝐑𝐍 🥀🥂🍂🤎🍻🎻
•◌────˚❀˚───◌ ────˚❀˚────🥀

━━━━━━━━━━━━━━━━━━
⊹ خـبـرتـي فـي الـبـوتـات:
• برمجة وتطوير بوتات فيسبوك ♧
`
    },
};

async function onCall({ message, getLang }) {
    try {
        const { threadID } = message;

        const imageURL =
            "https://i.ibb.co/wZDHSMvM/received-897009799489398.jpg";

        const imgStream = (
            await axios.get(imageURL, { responseType: "stream" })
        ).data;

        return global.api.sendMessage(
            {
                body: getLang("info"),
                attachment: imgStream,
            },
            threadID
        );
    } catch (e) {
        console.error("Developer info error:", e);
    }
}

export default {
    config,
    langData,
    onCall,
};
