-- 授权码系统表
CREATE TABLE IF NOT EXISTS `licenses` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `license_code` varchar(255) NOT NULL COMMENT '授权码',
  `type` varchar(20) NOT NULL COMMENT '授权类型: DAY, WEEK, MONTH, QUARTER, HALF_YEAR, YEAR, PERMANENT',
  `status` varchar(20) DEFAULT 'active' COMMENT '状态: active, used, expired, revoked',
  `issued_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '签发时间',
  `expiry_at` datetime DEFAULT NULL COMMENT '过期时间',
  `used_at` datetime DEFAULT NULL COMMENT '使用时间',
  `used_by` varchar(255) DEFAULT NULL COMMENT '使用者标识',
  `created_by` int(11) DEFAULT NULL COMMENT '创建者ID',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_license_code` (`license_code`),
  KEY `idx_type` (`type`),
  KEY `idx_status` (`status`),
  KEY `idx_expiry_at` (`expiry_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='授权码表';

-- 主网站系统表
CREATE TABLE IF NOT EXISTS `systems` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL COMMENT '系统名称',
  `domain` varchar(255) NOT NULL COMMENT '域名',
  `description` text COMMENT '系统描述',
  `icon` varchar(255) DEFAULT NULL COMMENT '图标URL',
  `status` varchar(20) DEFAULT 'enabled' COMMENT '状态: enabled, disabled',
  `sort_order` int(11) DEFAULT 0 COMMENT '排序',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_domain` (`domain`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统列表表';

-- 初始化系统数据
INSERT INTO `systems` (`name`, `domain`, `description`, `status`, `sort_order`) VALUES
('自动化发布系统', 'auto.mysoai.com', 'AI驱动的自动化内容发布系统，支持微信公众号、抖音等多平台发布', 'enabled', 1),
('短视频生成系统', 'video.mysoai.com', 'AI短视频自动生成工具，支持语音克隆、视频剪辑、字幕添加', 'enabled', 2),
('国学测算系统', 'guoxue.mysoai.com', '传统国学智慧与现代AI技术结合', 'enabled', 3),
('个人计划监督学习系统', 'learn.mysoai.com', '智能学习计划制定与执行监督系统', 'enabled', 4),
('标书自动生成系统', 'biaoshu.mysoai.com', '智能标书生成与管理平台', 'enabled', 5),
('RAG管理系统', 'rag.mysoai.com', '基于Dify的文档检索与知识管理系统', 'enabled', 6),
('数字人系统', 'human.mysoai.com', 'AI数字人直播与互动系统', 'enabled', 7),
('GEO系统', 'geo.mysoai.com', '基于关键词的AI检索优化系统', 'enabled', 8),
('广告助力系统', 'ad.mysoai.com', '微信朋友圈、短视频广告发布与流量获取系统', 'enabled', 9);

-- 轮播图表
CREATE TABLE IF NOT EXISTS `banners` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) DEFAULT NULL COMMENT '标题',
  `image_url` varchar(500) NOT NULL COMMENT '图片URL',
  `link_url` varchar(500) DEFAULT NULL COMMENT '链接URL',
  `status` varchar(20) DEFAULT 'enabled' COMMENT '状态: enabled, disabled',
  `sort_order` int(11) DEFAULT 0 COMMENT '排序',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='轮播图表';

-- 支付配置表
CREATE TABLE IF NOT EXISTS `payment_configs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `type` varchar(20) NOT NULL COMMENT '支付类型: wechat, alipay',
  `app_id` varchar(255) DEFAULT NULL COMMENT '应用ID',
  `mch_id` varchar(255) DEFAULT NULL COMMENT '商户号',
  `api_key` varchar(255) DEFAULT NULL COMMENT 'API密钥',
  `cert_path` varchar(500) DEFAULT NULL COMMENT '证书路径',
  `status` varchar(20) DEFAULT 'enabled' COMMENT '状态: enabled, disabled',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_type` (`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='支付配置表';

-- 订单表
CREATE TABLE IF NOT EXISTS `orders` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `order_no` varchar(64) NOT NULL COMMENT '订单号',
  `user_id` int(11) DEFAULT NULL COMMENT '用户ID',
  `system_id` int(11) NOT NULL COMMENT '系统ID',
  `license_type` varchar(20) NOT NULL COMMENT '授权类型',
  `amount` decimal(10,2) NOT NULL COMMENT '金额',
  `payment_type` varchar(20) DEFAULT NULL COMMENT '支付方式: wechat, alipay',
  `status` varchar(20) DEFAULT 'pending' COMMENT '状态: pending, paid, failed, refunded',
  `license_code` varchar(255) DEFAULT NULL COMMENT '生成的授权码',
  `paid_at` datetime DEFAULT NULL COMMENT '支付时间',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_order_no` (`order_no`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_system_id` (`system_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='订单表';

