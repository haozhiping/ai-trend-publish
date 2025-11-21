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
-- 6. 通知公告数据初始化（示例）
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

