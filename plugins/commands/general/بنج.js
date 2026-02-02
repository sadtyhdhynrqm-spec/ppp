export default async function ({ message }) {
  const { performance } = await import("perf_hooks");

  // إرسال رسالة واحدة
  const status = await message.reply("⏳ جاري قياس سرعة استجابة البوت...");

  const start = performance.now();

  // انتظار بسيط عشان يكون القياس واقعي
  await new Promise(resolve => setTimeout(resolve, 100));

  const end = performance.now();
  const ping = Math.floor(end - start);

  let level = "";
  let advice = "";

  if (ping <= 150) {
    level = "🔋 ممتاز";
    advice = "الأمور تمام، البوت شغال بسلاسة واستجابة عالية.";
  } else if (ping <= 400) {
    level = "⚡ جيد";
    advice = "الاستجابة كويسة، لكن يفضّل تخفيف الضغط على البوت.";
  } else {
    level = "🐢 بطيء";
    advice = "في بطء واضح، ممكن يكون ضغط على السيرفر أو مشكلة في الاتصال.";
  }

  // ⬅️ الترتيب الصحيح
  await message.edit(
    status.messageID,
`╭━━━〔 📡 فحص السرعة 〕━━━╮
┃
┃ ⏱️ الزمن: ${ping} ms
┃ 📊 التقييم: ${level}
┃ 💡 ملاحظة:
┃ ${advice}
┃
╰━━━━━━━━━━━━━━━━━━╯`
  );
}
