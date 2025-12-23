import { verifyKey } from "discord-interactions";

const PUBLIC_KEY = "4e4ac36962ee41736198ce2eda151ebd77cc0c9cdcd34625fa413451968a6f57";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  const signature = req.headers["x-signature-ed25519"];
  const timestamp = req.headers["x-signature-timestamp"];

  const isValid = verifyKey(
    JSON.stringify(req.body),
    signature,
    timestamp,
    PUBLIC_KEY
  );

  if (!isValid) {
    return res.status(401).send("Invalid request signature");
  }

  const interaction = req.body;

  // ① Discord 第一次会发 { "type": 1 }
  if (interaction.type === 1) {
    return res.status(200).json({ type: 1 });
  }

  // ② Slash Command（/check）
  if (interaction.type === 2) {
    const wallet = interaction.data.options[0].value;

    return res.status(200).json({
      type: 4,
      data: {
        content: `✅ **验证成功**\n钱包：\`${wallet}\``,
      },
    });
  }

  return res.status(400).send("Unknown interaction");
}
