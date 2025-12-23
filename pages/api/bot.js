import { ethers } from "ethers";
import {
  verifyKey,
  InteractionType,
  InteractionResponseType,
} from "discord-interactions";

/**
 * 🔑 必填：Discord Developer Portal → General Information → Public Key
 */
const PUBLIC_KEY =
  "4e4ac36962ee41736198ce2eda151ebd77cc0c9cdcd34625fa413451968a6f57";

/**
 * === 业务配置 ===
 */
const SOMNEX_POOL = "0xa3230CC5De48cdF903cD6f7FE81Aee037bFf8277";
const RPC_URL = "https://rpc.somnia.org/";
const START_TIME = 1734710400; // 2025-12-21 00:00 UTC
const END_TIME = 1735142399;   // 2025-12-25 23:59 UTC

/**
 * 检查是否在指定时间段内有交互（示例：存入 / 交易日志）
 */
async function checkLiquidity(account) {
  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);

    const filter = {
      address: SOMNEX_POOL,
      topics: [null, ethers.zeroPadValue(account, 32)],
      fromBlock: 0,
      toBlock: "latest",
    };

    const logs = await provider.getLogs(filter);

    for (const log of logs) {
      const block = await provider.getBlock(log.blockNumber);
      if (
        block &&
        block.timestamp >= START_TIME &&
        block.timestamp <= END_TIME
      ) {
        return true;
      }
    }

    return false;
  } catch (err) {
    console.error("checkLiquidity error:", err);
    return null;
  }
}

export default async function handler(req, res) {
  /**
   * 1️⃣ 验证 Discord 请求签名（非常关键）
   */
  const signature = req.headers["x-signature-ed25519"];
  const timestamp = req.headers["x-signature-timestamp"];

  const isValid = verifyKey(
    JSON.stringify(req.body),
    signature,
    timestamp,
    PUBLIC_KEY
  );

  if (!isValid) {
    return res.status(401).send("Invalid signature");
  }

  const interaction = req.body;

  /**
   * 2️⃣ Discord PING 校验
   */
  if (interaction.type === InteractionType.PING) {
    return res.status(200).json({
      type: InteractionResponseType.PONG,
    });
  }

  /**
   * 3️⃣ Slash Command: /check
   */
  if (
    interaction.type === InteractionType.APPLICATION_COMMAND &&
    interaction.data.name === "check"
  ) {
    const walletAddress = interaction.data.options[0].value;

    const eligible = await checkLiquidity(walletAddress);

    let content = "";
    if (eligible === null) {
      content = "❌ 网络异常，请稍后再试。";
    } else if (eligible) {
      content = `✅ **验证通过！**\n钱包地址: \`${walletAddress}\`\n已在 12.21–12.25 完成操作。`;
    } else {
      content = `⚠️ **未达标**\n钱包地址: \`${walletAddress}\`\n未在指定时间内检测到记录。`;
    }

    return res.status(200).json({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content,
      },
    });
  }

  // ⚠️ 一定要兜底，否则 Discord 会报 Unknown interaction type
return res.send({
  type: InteractionResponseType.PONG
});

}
