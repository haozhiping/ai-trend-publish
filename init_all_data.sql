-- 完整数据初始化脚本
-- 执行此脚本可以初始化所有需要的数据

-- ============================================
-- 1. 用户数据初始化
-- ============================================
-- 注意：密码是 admin123 的 bcrypt 哈希值（使用 bcryptjs 生成）
-- 生成方式：deno run scripts/generate-password-hash.ts
INSERT INTO `users` (`username`, `password`, `email`, `name`, `role`, `permissions`, `status`) VALUES
('admin', '$2a$10$WuCLPHaStyPhJZ3q.Ruwuu1ra16ESaeVYjK2rFw0VIPrCJkOoUR26', 'admin@example.com', '系统管理员', 'admin', '["*"]', 1)
ON DUPLICATE KEY UPDATE 
	`email` = VALUES(`email`),
	`name` = VALUES(`name`),
	`role` = VALUES(`role`);

-- ============================================
-- 2. 工作流数据初始化
-- ============================================
INSERT INTO `workflows` (`name`, `type`, `description`, `status`, `schedule`, `config`, `created_by`) VALUES
('微信文章工作流', 'weixin-article-workflow', '每日凌晨3点自动抓取AI相关内容并发布到微信公众号', 'running', '0 3 * * *', '{"articleNum": 10, "templateType": "default"}', 1),
('AI模型排行榜', 'weixin-aibench-workflow', '每周二更新AI模型性能排行榜', 'running', '0 3 * * 2', '{}', 1),
('GitHub热门项目', 'weixin-hellogithub-workflow', '每周三发布GitHub热门AI项目推荐', 'running', '0 3 * * 3', '{}', 1)
ON DUPLICATE KEY UPDATE 
	`description` = VALUES(`description`),
	`schedule` = VALUES(`schedule`),
	`config` = VALUES(`config`);

-- ============================================
-- 3. 模板数据初始化（示例）
-- ============================================
-- 注意：这里只插入模板元数据，实际模板内容在代码中
INSERT INTO `templates` (`name`, `description`, `platform`, `style`, `content`, `is_active`, `created_by`) VALUES
('默认文章模板', '简洁大方的文章模板，适合各类内容', 'weixin', 'default', '<div>默认模板内容</div>', 1, 1),
('现代风格模板', '时尚现代的设计风格，适合科技类文章', 'weixin', 'modern', '<div>现代模板内容</div>', 1, 1),
('技术专栏模板', '专为技术文章定制的排版样式', 'weixin', 'tech', '<div>技术模板内容</div>', 1, 1),
('AI排行榜模板', '大模型性能排行榜展示模板', 'weixin', 'aibench', '<div>排行榜模板内容</div>', 1, 1)
ON DUPLICATE KEY UPDATE 
	`description` = VALUES(`description`),
	`content` = VALUES(`content`);

-- ============================================
-- 4. 数据源数据初始化（示例）
-- ============================================
INSERT INTO `data_sources` (`platform`, `identifier`) VALUES
('firecrawl', 'https://news.ycombinator.com/'),
('firecrawl', 'https://www.reuters.com/technology/artificial-intelligence'),
('twitter', 'OpenAI'),
('twitter', 'deepseek_ai')
ON DUPLICATE KEY UPDATE `identifier` = VALUES(`identifier`);

-- ============================================
-- 5. 配置数据初始化（可选）
-- ============================================
-- 注意：如果配置表中已有数据，系统会优先使用数据库配置
-- 如果配置表中没有数据，系统会从 .env 文件读取
INSERT INTO `config` (`key`, `value`) VALUES
('ARTICLE_NUM', '10'),
('ARTICLE_TEMPLATE_TYPE', 'default'),
('AUTHOR', 'AI助手'),
('NEED_OPEN_COMMENT', 'false'),
('ONLY_FANS_CAN_COMMENT', 'false')
ON DUPLICATE KEY UPDATE `value` = VALUES(`value`);

-- ============================================
-- 6. 内容库数据初始化（测试数据）
-- ============================================
INSERT INTO `content` (`title`, `content`, `summary`, `url`, `source`, `platform`, `score`, `keywords`, `tags`, `status`, `publish_date`) VALUES
('DeepSeek-R1 登顶AI模型排行榜', 'DeepSeek-R1在最新的AI模型评测中表现出色，在多个基准测试中取得了领先成绩。该模型在推理能力、代码生成和数学问题解决方面都有显著提升，成为当前最受关注的开源大模型之一。', 'DeepSeek-R1在AI模型评测中表现优异，成为开源大模型新标杆。', 'https://example.com/deepseek-r1', 'twitter', 'weixin', 95.5, '["AI", "DeepSeek", "排行榜"]', '["技术", "AI模型"]', 'published', DATE_SUB(NOW(), INTERVAL 1 DAY)),
('OpenAI发布新版本GPT模型', 'OpenAI今日宣布发布新版本的GPT模型，在保持原有优势的基础上，进一步优化了响应速度和准确性。新版本在长文本处理和多轮对话方面有显著改进，预计将进一步提升用户体验。', 'OpenAI发布新版GPT模型，优化响应速度和准确性。', 'https://example.com/openai-gpt', 'firecrawl', 'weixin', 88.2, '["OpenAI", "GPT", "新版本"]', '["AI", "技术"]', 'published', DATE_SUB(NOW(), INTERVAL 2 DAY)),
('GitHub热门AI项目推荐', '本周GitHub上最受欢迎的AI项目包括多个开源大模型框架和工具库。这些项目在社区中获得了广泛关注，为开发者提供了丰富的AI开发资源。', 'GitHub本周热门AI项目盘点，开源大模型框架受关注。', 'https://example.com/github-ai', 'hellogithub', 'weixin', 82.7, '["GitHub", "AI项目", "开源"]', '["开源", "开发"]', 'draft', NULL),
('AI在医疗领域的应用突破', '最新研究显示，AI技术在医疗诊断和治疗方案制定方面取得了重要突破。通过深度学习算法，AI能够辅助医生进行更精准的疾病诊断，提高诊疗效率。', 'AI技术在医疗诊断领域取得重要突破，提升诊疗精准度。', 'https://example.com/ai-medical', 'firecrawl', 'weixin', 91.3, '["AI", "医疗", "诊断"]', '["医疗", "AI应用"]', 'published', DATE_SUB(NOW(), INTERVAL 3 DAY)),
('大语言模型训练成本大幅下降', '随着硬件技术的进步和算法优化，大语言模型的训练成本在过去一年中大幅下降。这使得更多研究机构和企业能够参与到AI模型的研发中来。', '大语言模型训练成本下降，推动AI研发普及。', 'https://example.com/llm-cost', 'twitter', 'weixin', 79.8, '["大模型", "训练", "成本"]', '["技术", "成本"]', 'draft', NULL),
('AI生成内容的质量评估标准', '业界正在制定AI生成内容的质量评估标准，以帮助用户更好地判断和使用AI生成的内容。这些标准将涵盖准确性、原创性、相关性等多个维度。', '业界制定AI生成内容质量评估标准，提升内容质量。', 'https://example.com/ai-content-quality', 'firecrawl', 'weixin', 85.6, '["AI生成", "内容质量", "评估"]', '["标准", "质量"]', 'published', DATE_SUB(NOW(), INTERVAL 4 DAY))
ON DUPLICATE KEY UPDATE 
	`content` = VALUES(`content`),
	`summary` = VALUES(`summary`),
	`score` = VALUES(`score`);

-- ============================================
-- 7. 通知公告数据初始化（示例）
-- ============================================
INSERT INTO `announcements` (`title`, `content`, `type`, `priority`, `status`, `target_users`, `publish_time`, `is_sticky`, `created_by`) VALUES
('系统维护通知', '系统将于今晚23:00-01:00进行维护升级，期间可能影响正常使用，请提前做好准备。', 'warning', 'high', 'published', 'all', NOW(), 1, 1),
('新功能上线公告', 'AI内容排序功能已正式上线，支持更智能的内容筛选和排序，欢迎体验使用。', 'success', 'medium', 'published', 'all', DATE_SUB(NOW(), INTERVAL 1 DAY), 0, 1),
('API额度调整说明', '为了更好地服务用户，我们对API调用额度进行了调整，详情请查看配置页面。', 'info', 'medium', 'published', 'admin', DATE_SUB(NOW(), INTERVAL 2 DAY), 0, 1)
ON DUPLICATE KEY UPDATE 
	`content` = VALUES(`content`),
	`type` = VALUES(`type`),
	`priority` = VALUES(`priority`);

-- ============================================
-- 注意事项
-- ============================================
-- 1. 用户密码：上面的密码哈希是示例，实际应该使用 bcrypt 生成
--    开发环境可以暂时使用简单的验证方式
-- 2. 模板内容：这里只插入元数据，实际模板内容在代码的 EJS 文件中
-- 3. 工作流配置：工作流的实际执行逻辑在代码中，这里只是配置数据
-- 4. 数据源：这里只是示例数据，实际数据源配置在代码中
-- 5. 配置优先级：数据库配置 > .env 配置

