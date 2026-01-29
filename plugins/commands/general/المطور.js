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
        info:
`✧ الـــــــــﻤطوࢪ | Ꮥ.ᎥᏁᎨᎧ ✧

⊹ الــبادئة: [-]
⊹ الــــــمطوࢪ: Ꮥ.ᎥᏁᎨᎧᎯᏴᎨᏟᎻᎥᎯᎶᎯ

⊹ الـعـمـر: 17

⊹ الـتـواصـل الـرسـمـي:
فـيـسـبـوك:
https://www.facebook.com/profile.php?id=61586897962846

━━━━━━━━━━━━━━━━━━`
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
