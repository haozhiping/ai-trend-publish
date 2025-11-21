-- 数据库初始化数据脚本
-- 执行此脚本可以初始化一些基础配置数据

-- 注意：如果配置表中已有数据，系统会优先使用数据库中的配置
-- 如果配置表中没有数据，系统会从 .env 文件读取配置

-- 插入基础配置（可选，系统会从 .env 读取）
-- 如果需要通过数据库管理配置，可以取消注释以下内容

/*
-- 工作流配置
INSERT INTO `config` (`key`, `value`) VALUES
('ARTICLE_NUM', '10'),
('ARTICLE_TEMPLATE_TYPE', 'default'),
('AUTHOR', 'AI助手'),
('NEED_OPEN_COMMENT', 'false'),
('ONLY_FANS_CAN_COMMENT', 'false')
ON DUPLICATE KEY UPDATE `value` = VALUES(`value`);

-- LLM 配置（通常从 .env 读取，这里只是示例）
-- INSERT INTO `config` (`key`, `value`) VALUES
-- ('DEFAULT_LLM_PROVIDER', 'DEEPSEEK'),
-- ('AI_CONTENT_RANKER_LLM_PROVIDER', 'DEEPSEEK'),
-- ('AI_SUMMARIZER_LLM_PROVIDER', 'DEEPSEEK')
-- ON DUPLICATE KEY UPDATE `value` = VALUES(`value`);
*/

-- 数据源示例（可选）
-- INSERT INTO `data_sources` (`platform`, `identifier`) VALUES
-- ('twitter', 'example_user'),
-- ('firecrawl', 'https://example.com')
-- ON DUPLICATE KEY UPDATE `identifier` = VALUES(`identifier`);

-- 注意：
-- 1. 系统配置优先从数据库读取，如果数据库中没有，会从 .env 文件读取
-- 2. 敏感信息（如 API Key）建议放在 .env 文件中，不要放在数据库
-- 3. 数据库配置可以覆盖 .env 中的配置

