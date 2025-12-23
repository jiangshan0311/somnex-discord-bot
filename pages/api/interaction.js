import { verifyKey } from "discord-interactions";

export const config = {
  api: {
    bodyParser: false,
  },
};

const PUBLIC_KEY = process.env.DISCORD_PUBLIC_KEY;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).end("Method Not Allowed");
  }

  const signature = req.headers["x-signature-ed25519"];
  const timestamp = req.headers["x-signature-timestamp"];

  // ✅ Vercel 正确读取 raw body 的方式
  const rawBody = Buffer.from(await req.arrayBuffer());

  const isValid = verifyKey(
    rawBody,
    signature,
    timestamp,
    PUBLIC_KEY
  );

  if (!isValid) {
    return res.status(401).send("Bad request signature");
  }

  const interaction = JSON.parse(rawBody.toString());

  // Discord PING 校验
  if (interaction.type === 1) {
    return res.status(200).json({ type: 1 });
  }

  return res.status(200).json({
    type: 4,
    data: {
      content: "Somnex Verifier is alive 🚀",
    },
  });
}
