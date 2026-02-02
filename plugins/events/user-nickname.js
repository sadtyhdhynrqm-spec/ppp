export default async function ({ event }) {
    const { api, botID } = global;
    const { threadID, author, logMessageData } = event;
    const { Threads, Users } = global.controllers;

    const thread = await Threads.get(threadID);
    if (!thread?.info) return;

    const threadData = thread.data || {};
    const threadInfo = thread.info || {};
    const antiSettings = threadData.antiSettings || {};

    const userID = logMessageData.participant_id;
    const oldNickname = threadInfo.nicknames?.[userID] ?? "";
    const newNickname = logMessageData.nickname ?? "";

    let reversed = false;
    let smallCheck = false;
    let alertMsg;

    /* ===== Anti Change Nickname ===== */
    if (antiSettings.antiChangeNickname === true) {
        const isBot = author === botID;
        const isReversing = global.data.temps.some(
            i => i.type === "antiChangeNickname" && i.threadID === threadID
        );

        if (!(isBot && isReversing)) {
            global.data.temps.push({ type: "antiChangeNickname", threadID });

            await new Promise(resolve => {
                api.changeNickname(oldNickname, threadID, userID, () => {
                    reversed = true;

                    const idx = global.data.temps.findIndex(
                        i => i.type === "antiChangeNickname" && i.threadID === threadID
                    );
                    if (idx !== -1) global.data.temps.splice(idx, 1);

                    resolve();
                });
            });
        } else if (isBot) {
            smallCheck = true;
        }
    } else {
        threadInfo.nicknames[userID] = newNickname;
        await Threads.updateInfo(threadID, { nicknames: threadInfo.nicknames });
    }

    /* ===== رسالة الرجوع ===== */
    if (!smallCheck && reversed && antiSettings.notifyChange === true) {
        api.sendMessage(
            getLang("plugin.events.user-nickname.reversed_t"),
            threadID
        );
    }

    /* ===== إشعارات المتابعة ===== */
    if (!smallCheck && threadData?.notifyChange?.status === true) {
        const authorName = (await Users.getInfo(author))?.name || author;
        const targetName = (await Users.getInfo(userID))?.name || userID;

        if (author === userID) {
            alertMsg = getLang("plugin.events.user-nickname.changedBySelf", {
                authorName,
                authorId: author,
                newNickname
            });
        } else {
            alertMsg = getLang("plugin.events.user-nickname.changedBy", {
                authorName,
                authorId: author,
                targetName,
                targetId: userID,
                newNickname
            });
        }

        if (reversed) {
            alertMsg += getLang("plugin.events.user-nickname.reversed");
        }

        for (const rUID of threadData.notifyChange.registered || []) {
            await global.sleep(300);
            api.sendMessage(alertMsg, rUID);
        }
    }
							  }
