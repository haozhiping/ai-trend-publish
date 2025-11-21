/**
 * 从 .env 文件初始化配置到数据库
 * 使用方法: deno run --allow-read --allow-env --allow-net scripts/init-config-from-env.ts
 */

import { config } from "../src/db/schema.ts";
import db from "../src/db/db.ts";
import { eq } from "drizzle-orm";
import dotenv from "npm:dotenv";
import process from "node:process";

// 加载 .env 文件
dotenv.config();

// 需要初始化的配置键列表（排除数据库相关配置，避免循环依赖）
// 统一使用标准键名：BASE_URL 格式，AI_ 前缀
const configKeysToInit = [
  // LLM 配置
  "DEFAULT_LLM_PROVIDER",
  "OPENAI_BASE_URL",        // 统一使用 BASE_URL 格式
  "OPENAI_API_KEY",
  "OPENAI_MODEL",
  "DEEPSEEK_BASE_URL",      // 统一使用 BASE_URL 格式
  "DEEPSEEK_API_KEY",
  "DEEPSEEK_MODEL",
  "QWEN_BASE_URL",          // 统一使用 BASE_URL 格式
  "QWEN_API_KEY",
  "QWEN_MODEL",
  "XUNFEI_API_KEY",
  "CUSTOM_LLM_BASE_URL",
  "CUSTOM_LLM_API_KEY",
  "CUSTOM_LLM_MODEL",
  // 模块配置
  "AI_CONTENT_RANKER_LLM_PROVIDER",    // 统一使用 AI_ 前缀
  "AI_SUMMARIZER_LLM_PROVIDER",        // 统一使用 AI_ 前缀
  "ARTICLE_TEMPLATE_TYPE",
  "ARTICLE_NUM",
  // 微信配置
  "WEIXIN_APP_ID",
  "WEIXIN_APP_SECRET",
  "AUTHOR",
  "NEED_OPEN_COMMENT",
  "ONLY_FANS_CAN_COMMENT",
  // 数据源配置
  "FIRE_CRAWL_API_KEY",
  "TWITTER_API_KEY",
  "X_API_BEARER_TOKEN",
  "DASHSCOPE_API_KEY",
  "JINA_API_KEY",
  // 通知配置
  "ENABLE_BARK",
  "BARK_URL",
  // 其他配置
  "SERVER_API_KEY",
  "ENABLE_DEDUPLICATION",
];

async function initConfigFromEnv() {
  console.log("开始从 .env 文件初始化配置到数据库...\n");

  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (const key of configKeysToInit) {
    const value = process.env[key];

    if (!value || value.trim() === "") {
      console.log(`⏭️  跳过 ${key} (未设置或为空)`);
      skipCount++;
      continue;
    }

    try {
      // 检查配置是否已存在
      const existing = await db
        .select()
        .from(config)
        .where(eq(config.key, key))
        .limit(1);

      if (existing.length > 0) {
        // 更新现有配置
        await db
          .update(config)
          .set({ value: value.trim() })
          .where(eq(config.key, key));
        console.log(`✅ 更新 ${key} = ${maskSensitiveValue(key, value)}`);
      } else {
        // 插入新配置
        await db.insert(config).values({
          key,
          value: value.trim(),
        });
        console.log(`✅ 新增 ${key} = ${maskSensitiveValue(key, value)}`);
      }
      successCount++;
    } catch (error) {
      console.error(`❌ 处理 ${key} 失败:`, error instanceof Error ? error.message : String(error));
      errorCount++;
    }
  }

  console.log("\n" + "=".repeat(50));
  console.log("初始化完成！");
  console.log(`✅ 成功: ${successCount} 个`);
  console.log(`⏭️  跳过: ${skipCount} 个`);
  console.log(`❌ 失败: ${errorCount} 个`);
  console.log("=".repeat(50));
  console.log("\n提示：");
  console.log("- 数据库配置优先级高于 .env 配置");
  console.log("- 修改配置后需要重启后端服务才能生效");
  console.log("- 敏感信息（如 API 密钥）建议保留在 .env 文件中");
}

/**
 * 掩码敏感值（只显示前几位和后几位）
 */
function maskSensitiveValue(key: string, value: string): string {
  // 如果是 API 密钥或密码相关的配置，进行掩码处理
  const sensitiveKeys = [
    "API_KEY",
    "SECRET",
    "PASSWORD",
    "TOKEN",
    "BEARER",
  ];

  const isSensitive = sensitiveKeys.some((sensitive) =>
    key.toUpperCase().includes(sensitive)
  );

  if (!isSensitive || value.length <= 8) {
    return value;
  }

  // 显示前 4 位和后 4 位，中间用 * 代替
  const prefix = value.substring(0, 4);
  const suffix = value.substring(value.length - 4);
  const masked = "*".repeat(Math.min(value.length - 8, 8));
  return `${prefix}${masked}${suffix}`;
}

// 执行初始化
initConfigFromEnv()
  .then(() => {
    console.log("\n脚本执行完成");
    Deno.exit(0);
  })
  .catch((error) => {
    console.error("\n脚本执行失败:", error);
    Deno.exit(1);
  });

