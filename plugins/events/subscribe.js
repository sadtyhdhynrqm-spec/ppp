export default async function subscribe({ event }) {
    const { api } = global;
    const { threadID, author, logMessageData } = event;
    const { Threads, Users } = global.controllers;
    const getThread = await Threads.get(threadID);

    if (!getThread) return;

    const getThreadData = getThread.data;
    const getThreadInfo = getThread.info;

    // تحديث أعضاء المجموعة
    for (const user of logMessageData.addedParticipants) {
        if (!getThreadInfo.members.some(mem => mem.userID == user.userFbId)) {
            getThreadInfo.members.push({ userID: user.userFbId });
        }
    }

    const authorName = (await Users.getInfo(author))?.name || author;

    // تحضير أسماء الأعضاء الجدد
    const joinNameArray = [];
    const mentions = [];
    for (const participant of logMessageData.addedParticipants) {
        const uid = participant.userFbId;
        const joinName = participant.fullName;
        joinNameArray.push(joinName);
        mentions.push({ id: uid, tag: joinName });
    }

    if (joinNameArray.length === 0) return;

    // توليد رسالة الترحيب المزخرفة مع الإطار الكبير والأقواس الجديدة
    const welcomeMsg = `
◯⊰▰▱▰▱▰▱▰▱▰▱▰▱▰▱▰⊱◯
❖ أهلاً وسهلاً بالأعضاء الجدد! ❖

${joinNameArray.map((name, i) => `➳ العضو #${i + 1}: ❪🧡${name}❫🧡`).join('\n')}

☆ نتمنى لكم قضاء أجمل الأوقات في مجموعة ${getThreadInfo.name || threadID} ☆

◯⊰▰▱▰▱▰▱▰▱▰▱▰▱▰▱▰⊱◯
`;

    // إرسال رسالة الترحيب
    api.sendMessage({ body: welcomeMsg, mentions }, threadID, (err) => {
        if (err) console.error(err);
    });

    // تحديث معلومات الأعضاء في قاعدة البيانات
    await Threads.updateInfo(threadID, { members: getThreadInfo.members });

    return;
            }
