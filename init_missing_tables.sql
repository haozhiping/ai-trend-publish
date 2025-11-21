-- 补齐缺失的数据库表结构
-- 执行此脚本可以创建前端需要的所有表

-- 1. 用户表
CREATE TABLE IF NOT EXISTS `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`username` varchar(50) NOT NULL UNIQUE,
	`password` varchar(255) NOT NULL,
	`email` varchar(100),
	`name` varchar(100),
	`avatar` varchar(255),
	`role` varchar(20) DEFAULT 'user' NOT NULL,
	`permissions` json,
	`status` tinyint DEFAULT 1 NOT NULL,
	`created_at` timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
	`last_login_at` timestamp NULL,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	INDEX `idx_username` (`username`),
	INDEX `idx_email` (`email`)
);

-- 2. 工作流表
CREATE TABLE IF NOT EXISTS `workflows` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`type` varchar(50) NOT NULL,
	`description` text,
	`status` varchar(20) DEFAULT 'stopped' NOT NULL,
	`schedule` varchar(100),
	`config` json,
	`last_run` timestamp NULL,
	`next_run` timestamp NULL,
	`run_count` int DEFAULT 0,
	`success_count` int DEFAULT 0,
	`fail_count` int DEFAULT 0,
	`created_at` timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
	`created_by` int,
	CONSTRAINT `workflows_id` PRIMARY KEY(`id`),
	INDEX `idx_type` (`type`),
	INDEX `idx_status` (`status`)
);

-- 3. 内容表
CREATE TABLE IF NOT EXISTS `content` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`title` varchar(500) NOT NULL,
	`content` text,
	`summary` text,
	`url` varchar(1000),
	`source` varchar(50) NOT NULL,
	`platform` varchar(50),
	`score` decimal(5,2),
	`keywords` json,
	`tags` json,
	`status` varchar(20) DEFAULT 'draft' NOT NULL,
	`publish_date` timestamp NULL,
	`created_at` timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT `content_id` PRIMARY KEY(`id`),
	INDEX `idx_source` (`source`),
	INDEX `idx_status` (`status`),
	INDEX `idx_publish_date` (`publish_date`)
);

-- 4. 发布历史表
CREATE TABLE IF NOT EXISTS `publish_history` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`title` varchar(500) NOT NULL,
	`platform` varchar(50) NOT NULL,
	`status` varchar(20) NOT NULL,
	`publish_time` timestamp NOT NULL,
	`url` varchar(1000),
	`article_count` int DEFAULT 0,
	`success_count` int DEFAULT 0,
	`fail_count` int DEFAULT 0,
	`workflow_type` varchar(50),
	`workflow_id` int,
	`error_message` text,
	`metadata` json,
	`created_at` timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT `publish_history_id` PRIMARY KEY(`id`),
	INDEX `idx_platform` (`platform`),
	INDEX `idx_status` (`status`),
	INDEX `idx_publish_time` (`publish_time`),
	INDEX `idx_workflow_type` (`workflow_type`)
);

-- 5. 系统日志表
CREATE TABLE IF NOT EXISTS `system_logs` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`timestamp` timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`level` varchar(20) NOT NULL,
	`module` varchar(100),
	`message` text NOT NULL,
	`details` json,
	`user_id` int,
	`ip_address` varchar(50),
	CONSTRAINT `system_logs_id` PRIMARY KEY(`id`),
	INDEX `idx_timestamp` (`timestamp`),
	INDEX `idx_level` (`level`),
	INDEX `idx_module` (`module`)
);

-- 6. 通知公告表
CREATE TABLE IF NOT EXISTS `announcements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`content` text NOT NULL,
	`type` varchar(20) DEFAULT 'info' NOT NULL,
	`priority` varchar(20) DEFAULT 'medium' NOT NULL,
	`status` varchar(20) DEFAULT 'draft' NOT NULL,
	`target_users` varchar(50) DEFAULT 'all' NOT NULL,
	`publish_time` timestamp NULL,
	`expire_time` timestamp NULL,
	`is_sticky` tinyint DEFAULT 0,
	`read_count` int DEFAULT 0,
	`created_by` int,
	`created_at` timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT `announcements_id` PRIMARY KEY(`id`),
	INDEX `idx_status` (`status`),
	INDEX `idx_publish_time` (`publish_time`),
	INDEX `idx_is_sticky` (`is_sticky`)
);

-- 7. 用户通知表
CREATE TABLE IF NOT EXISTS `notifications` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`content` text NOT NULL,
	`type` varchar(50) NOT NULL,
	`priority` varchar(20) DEFAULT 'medium' NOT NULL,
	`is_read` tinyint DEFAULT 0 NOT NULL,
	`read_at` timestamp NULL,
	`time` timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`source` varchar(100),
	`action_url` varchar(500),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`),
	INDEX `idx_user_id` (`user_id`),
	INDEX `idx_is_read` (`is_read`),
	INDEX `idx_time` (`time`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);

