-- 添加短视频模板
INSERT INTO `templates` (`name`, `description`, `platform`, `style`, `type`, `content`, `is_active`, `is_default`, `preview_url`, `created_at`, `updated_at`) VALUES
('抖音科技热点模板', '适用于抖音科技热点视频的模板', 'douyin', 'tech', 'video', '<div>抖音科技热点视频模板内容</div>', 1, 1, '', NOW(), NOW()),
('抖音新闻热点模板', '适用于抖音新闻热点视频的模板', 'douyin', 'news', 'video', '<div>抖音新闻热点视频模板内容</div>', 1, 0, '', NOW(), NOW()),
('快手短视频模板', '适用于快手短视频的模板', 'kuaishou', 'default', 'video', '<div>快手短视频模板内容</div>', 1, 0, '', NOW(), NOW()),
('B站视频模板', '适用于B站视频的模板', 'bilibili', 'default', 'video', '<div>B站视频模板内容</div>', 1, 0, '', NOW(), NOW()),
('小红书视频模板', '适用于小红书视频的模板', 'xiaohongshu', 'default', 'video', '<div>小红书视频模板内容</div>', 1, 0, '', NOW(), NOW())
ON DUPLICATE KEY UPDATE 
  `description` = VALUES(`description`),
  `updated_at` = NOW();

-- 确保 video 类型的模板存在
-- 如果已存在，则更新；如果不存在，则插入

