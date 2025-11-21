-- 配置键名统一迁移脚本
-- 将旧的配置键名更新为新的统一键名
-- 执行前请备份数据库！

-- ============================================
-- 1. API Base URL 键名统一
-- ============================================
-- 将 OPENAI_API_BASE 更新为 OPENAI_BASE_URL
UPDATE `config` 
SET `key` = 'OPENAI_BASE_URL' 
WHERE `key` = 'OPENAI_API_BASE';

-- 将 DEEPSEEK_API_BASE 更新为 DEEPSEEK_BASE_URL
UPDATE `config` 
SET `key` = 'DEEPSEEK_BASE_URL' 
WHERE `key` = 'DEEPSEEK_API_BASE';

-- 将 QWEN_API_BASE 更新为 QWEN_BASE_URL
UPDATE `config` 
SET `key` = 'QWEN_BASE_URL' 
WHERE `key` = 'QWEN_API_BASE';

-- ============================================
-- 2. 模块配置键名统一
-- ============================================
-- 将 CONTENT_RANKER_LLM_PROVIDER 更新为 AI_CONTENT_RANKER_LLM_PROVIDER
UPDATE `config` 
SET `key` = 'AI_CONTENT_RANKER_LLM_PROVIDER' 
WHERE `key` = 'CONTENT_RANKER_LLM_PROVIDER';

-- 将 CONTENT_SUMMARIZER_LLM_PROVIDER 更新为 AI_SUMMARIZER_LLM_PROVIDER
UPDATE `config` 
SET `key` = 'AI_SUMMARIZER_LLM_PROVIDER' 
WHERE `key` = 'CONTENT_SUMMARIZER_LLM_PROVIDER';

-- ============================================
-- 3. 其他配置键名统一（如果需要）
-- ============================================
-- 注意：如果数据库中有其他需要统一的键名，可以在这里添加

-- ============================================
-- 验证迁移结果
-- ============================================
-- 执行后可以运行以下查询验证：
-- SELECT `key`, `value` FROM `config` WHERE `key` IN (
--   'OPENAI_BASE_URL', 'DEEPSEEK_BASE_URL', 'QWEN_BASE_URL',
--   'AI_CONTENT_RANKER_LLM_PROVIDER', 'AI_SUMMARIZER_LLM_PROVIDER'
-- ) ORDER BY `key`;

