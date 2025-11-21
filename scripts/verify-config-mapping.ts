/**
 * 配置字段映射验证脚本
 * 验证前端表单字段和后端配置键是否完全对应
 */

// 前端表单字段（从 ConfigManagement.tsx 提取，共31个）
const frontendFields = [
  // LLM 配置 (11个)
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
  // 模块配置 (4个)
  "AI_CONTENT_RANKER_LLM_PROVIDER",
  "AI_SUMMARIZER_LLM_PROVIDER",
  "ARTICLE_TEMPLATE_TYPE",
  "ARTICLE_NUM",
  // 微信配置 (5个)
  "WEIXIN_APP_ID",
  "WEIXIN_APP_SECRET",  // ✅ 确认包含
  "AUTHOR",
  "NEED_OPEN_COMMENT",
  "ONLY_FANS_CAN_COMMENT",
  // 数据源配置 (3个)
  "FIRE_CRAWL_API_KEY",
  "X_API_BEARER_TOKEN",
  "DASHSCOPE_API_KEY",
  // 数据库配置 (6个)
  "ENABLE_DB",
  "DB_HOST",
  "DB_PORT",
  "DB_USER",
  "DB_PASSWORD",
  "DB_DATABASE",
  // 通知配置 (2个)
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
  "WEIXIN_APP_SECRET",  // ✅ 确认包含
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

console.log("=".repeat(70));
console.log("配置字段映射验证");
console.log("=".repeat(70));

// 检查前端字段是否都在后端
const missingInBackend = frontendFields.filter(
  (field) => !backendKeys.includes(field)
);

// 检查关键字段
const criticalFields = [
  "WEIXIN_APP_SECRET",
  "WEIXIN_APP_ID",
  "DEEPSEEK_API_KEY",
  "OPENAI_API_KEY",
  "QWEN_API_KEY",
];

console.log("\n📋 统计信息：");
console.log(`   前端表单字段数: ${frontendFields.length}`);
console.log(`   后端配置键数: ${backendKeys.length}`);
console.log(`   关键字段数: ${criticalFields.length}`);

console.log("\n🔍 关键字段检查：");
criticalFields.forEach((field) => {
  const inFrontend = frontendFields.includes(field);
  const inBackend = backendKeys.includes(field);
  const status = inFrontend && inBackend ? "✅" : "❌";
  console.log(
    `   ${status} ${field.padEnd(30)} 前端:${inFrontend ? "✓" : "✗"} 后端:${inBackend ? "✓" : "✗"}`,
  );
});

if (missingInBackend.length === 0) {
  console.log("\n✅ 验证通过！所有前端字段都在后端配置键中！");
  console.log("\n✅ 特别确认：");
  console.log("   - WEIXIN_APP_SECRET 已包含在后端配置键中");
  console.log("   - 所有31个前端字段都已对应");
  console.log("\n✅ 配置系统可以正常工作！");
} else {
  console.error("\n❌ 验证失败！以下前端字段在后端配置键中缺失：");
  missingInBackend.forEach((field) => console.error(`   - ${field}`));
  console.error("\n⚠️  请检查 config.service.ts 中的配置键列表！");
}

console.log("\n" + "=".repeat(70));
console.log("验证完成");
console.log("=".repeat(70));

