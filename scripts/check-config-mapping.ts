/**
 * 配置字段映射检查脚本
 * 用于验证前端表单字段和后端配置键是否完全对应
 */

// 前端表单字段（从 ConfigManagement.tsx 提取）
const frontendFields = [
  // LLM 配置
  "DEFAULT_LLM_PROVIDER",
  "OPENAI_BASE_URL",
  "OPENAI_API_KEY",
  "OPENAI_MODEL",
  "DEEPSEEK_BASE_URL",
  "DEEPSEEK_API_KEY",
  "DEEPSEEK_MODEL",
  "QWEN_BASE_URL",
  "QWEN_API_KEY",
  "QWEN_MODEL",
  "XUNFEI_API_KEY",
  // 模块配置
  "AI_CONTENT_RANKER_LLM_PROVIDER",
  "AI_SUMMARIZER_LLM_PROVIDER",
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
  "X_API_BEARER_TOKEN",
  "DASHSCOPE_API_KEY",
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
];

// 后端配置键（从 config.service.ts 提取）
const backendKeys = [
  // LLM 配置
  "DEFAULT_LLM_PROVIDER",
  "OPENAI_BASE_URL",
  "OPENAI_API_KEY",
  "OPENAI_MODEL",
  "DEEPSEEK_BASE_URL",
  "DEEPSEEK_API_KEY",
  "DEEPSEEK_MODEL",
  "QWEN_BASE_URL",
  "QWEN_API_KEY",
  "QWEN_MODEL",
  "XUNFEI_API_KEY",
  "CUSTOM_LLM_BASE_URL",
  "CUSTOM_LLM_API_KEY",
  "CUSTOM_LLM_MODEL",
  // 模块配置
  "AI_CONTENT_RANKER_LLM_PROVIDER",
  "AI_SUMMARIZER_LLM_PROVIDER",
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

console.log("=".repeat(60));
console.log("配置字段映射检查");
console.log("=".repeat(60));

// 检查前端字段是否都在后端
const missingInBackend = frontendFields.filter(
  (field) => !backendKeys.includes(field)
);

// 检查后端键是否都在前端（排除可选配置）
const optionalKeys = [
  "CUSTOM_LLM_BASE_URL",
  "CUSTOM_LLM_API_KEY",
  "CUSTOM_LLM_MODEL",
  "TWITTER_API_KEY", // 前端使用 X_API_BEARER_TOKEN
  "JINA_API_KEY",
  "SERVER_API_KEY",
  "ENABLE_DEDUPLICATION",
];
const missingInFrontend = backendKeys.filter(
  (key) => !frontendFields.includes(key) && !optionalKeys.includes(key)
);

if (missingInBackend.length === 0 && missingInFrontend.length === 0) {
  console.log("✅ 所有前端字段都在后端配置键中！");
  console.log(`✅ 前端字段数: ${frontendFields.length}`);
  console.log(`✅ 后端配置键数: ${backendKeys.length}`);
  console.log(`✅ 可选配置键数: ${optionalKeys.length}`);
} else {
  if (missingInBackend.length > 0) {
    console.error("❌ 以下前端字段在后端配置键中缺失：");
    missingInBackend.forEach((field) => console.error(`   - ${field}`));
  }
  if (missingInFrontend.length > 0) {
    console.warn("⚠️  以下后端配置键在前端表单中缺失（可能是可选配置）：");
    missingInFrontend.forEach((key) => console.warn(`   - ${key}`));
  }
}

console.log("\n" + "=".repeat(60));
console.log("检查完成");
console.log("=".repeat(60));

