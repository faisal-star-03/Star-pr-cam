import formidable from 'formidable';
import fs from 'fs';
import { Telegraf } from 'telegraf';

const bot = new Telegraf(process.env.BOT_TOKEN);

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send("Method Not Allowed");

  const form = new formidable.IncomingForm({ uploadDir: "/tmp", keepExtensions: true });

  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(500).send("Form parse error");

    const uid = fields.uid;
    if (!uid) return res.status(400).send("UID missing");

    try {
      for (let i = 1; i <= 4; i++) {
        const file = files['photo'+i];
        if (!file) continue;

        const buffer = fs.readFileSync(file.filepath);
        await bot.telegram.sendPhoto(uid, { source: buffer });
        if (process.env.ADMIN_ID) await bot.telegram.sendPhoto(process.env.ADMIN_ID, { source: buffer });
        fs.unlinkSync(file.filepath);
      }

      res.status(200).send("✅ 4 Photos sent successfully.");
    } catch (e) {
      console.error(e);
      res.status(500).send("❌ Error sending photos to Telegram");
    }
  });
}
