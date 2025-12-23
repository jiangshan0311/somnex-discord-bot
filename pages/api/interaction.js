export const config = {
  api: {
    bodyParser: true,
  },
};

export default async function handler(req, res) {
  // 只允许 POST
  if (req.method !== "POST") {
    return res.status(405).end("Method Not Allowed");
  }

  const interaction = req.body;

  // ✅ Discord 验证 PING
  if (interaction?.type === 1) {
    return res.status(200).json({ type: 1 });
  }

  // 临时兜底
  return res.status(200).json({
    type: 4,
    data: {
      content: "Somnex Verifier is alive 🚀",
    },
  });
}
