import db from "@src/db/db.ts";
import { config } from "@src/db/schema.ts";
import { eq } from "drizzle-orm";
import { ConfigManager } from "@src/utils/config/config-manager.ts";

/**
 * 获取所有配置（合并数据库和 .env 的值）
 * 返回格式：{ key: value }
 */
export async function getAllConfigs(): Promise<Record<string, any>> {
  const configManager = ConfigManager.getInstance();
  const result: Record<string, any> = {};

  // 定义所有可能的配置键（统一使用前端和后端代码中使用的键名）
  const configKeys = [
    // LLM 配置
    "DEFAULT_LLM_PROVIDER",
    "OPENAI_BASE_URL",        // 统一使用 BASE_URL 格式（与后端代码一致）
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
    "AI_CONTENT_RANKER_LLM_PROVIDER",    // 统一使用 AI_ 前缀（与后端代码一致）
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
    // 数据库配置
    "ENABLE_DB",
    "DB_HOST",
    "DB_PORT",
    "DB_USER",
    "DB_PASSWORD",
    "DB_DATABASE",
    // 通知配置
    "ENABLE_BARK",
    "BARK_URL",
    // 其他配置
    "SERVER_API_KEY",
    "ENABLE_DEDUPLICATION",
  ];

  // 从 ConfigManager 获取每个配置值（会自动合并数据库和 .env）
  for (const key of configKeys) {
    try {
      const value = await configManager.get(key);
      result[key] = value;
    } catch (error) {
      // 如果配置不存在，设置为 null
      result[key] = null;
    }
  }

  return result;
}

/**
 * 更新配置（保存到数据库）
 */
export async function updateConfig(
  key: string,
  value: string | number | boolean,
): Promise<void> {
  // 将值转换为字符串
  const stringValue = typeof value === "string" ? value : String(value);

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
      .set({ value: stringValue })
      .where(eq(config.key, key));
  } else {
    // 插入新配置
    await db.insert(config).values({
      key,
      value: stringValue,
    });
  }
}

/**
 * 批量更新配置
 */
export async function updateConfigs(
  configs: Record<string, string | number | boolean>,
): Promise<void> {
  for (const [key, value] of Object.entries(configs)) {
    await updateConfig(key, value);
  }
}

