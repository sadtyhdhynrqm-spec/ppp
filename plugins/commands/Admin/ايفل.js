const axios = require("axios");
const fs = require("fs-extra");

const config = {
    name: "ايفل",
    description: "خاص بزهير",
    cooldown: 0,
    permissions: [2],
    credits: "Gry KJ"
};

const langData = {};

async function onCall({ message, api, args }) {
    try {

        function output(msg) {
            if (typeof msg == "number" || typeof msg == "boolean" || typeof msg == "function")
                msg = msg.toString();
            else if (msg instanceof Map) {
                let text = `Map(${msg.size}) `;
                text += JSON.stringify(mapToObj(msg), null, 2);
                msg = text;
            }
            else if (typeof msg == "object")
                msg = JSON.stringify(msg, null, 2);
            else if (typeof msg == "undefined")
                msg = "undefined";

            api.sendMessage(msg, message.threadID, message.messageID);
        }

        function out(msg) {
            output(msg);
        }

        function mapToObj(map) {
            const obj = {};
            map.forEach(function (v, k) {
                obj[k] = v;
            });
            return obj;
        }

        const cmd = `
        (async () => {
            try {
                ${args.join(" ")}
            }
            catch(err) {
                console.log("eval command", err);
                api.sendMessage(err.message, "${message.threadID}", "${message.messageID}");
            }
        })()
        `;

        eval(cmd);

    } catch (err) {
        console.log(err);
    }
}

export default { config, langData, onCall };
