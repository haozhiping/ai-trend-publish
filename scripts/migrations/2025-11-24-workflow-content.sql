-- 数据源表扩展
ALTER TABLE `data_sources`
  ADD COLUMN `name` VARCHAR(255) NOT NULL AFTER `id`,
  ADD COLUMN `type` VARCHAR(50) NOT NULL AFTER `name`,
  ADD COLUMN `url` VARCHAR(1000) NULL AFTER `identifier`,
  ADD COLUMN `enabled` TINYINT(1) DEFAULT 1 NOT NULL AFTER `url`,
  ADD COLUMN `status` VARCHAR(20) DEFAULT 'active' NOT NULL AFTER `enabled`,
  ADD COLUMN `description` TEXT NULL AFTER `status`,
  ADD COLUMN `config` JSON NULL AFTER `description`,
  ADD COLUMN `last_sync_at` DATETIME NULL AFTER `config`,
  ADD COLUMN `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
  ADD COLUMN `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL ON UPDATE CURRENT_TIMESTAMP;

CREATE INDEX `idx_data_source_type` ON `data_sources` (`type`);
CREATE INDEX `idx_data_source_status` ON `data_sources` (`status`);

-- 内容表扩展
ALTER TABLE `content`
  ADD COLUMN `metadata` JSON NULL AFTER `tags`,
  ADD COLUMN `workflow_id` INT NULL AFTER `publish_date`,
  ADD COLUMN `workflow_type` VARCHAR(50) NULL AFTER `workflow_id`,
  ADD COLUMN `workflow_event_id` VARCHAR(100) NULL AFTER `workflow_type`;

CREATE INDEX `idx_content_workflow` ON `content` (`workflow_id`);

-- 发布历史表扩展
ALTER TABLE `publish_history`
  ADD COLUMN `event_id` VARCHAR(100) NULL AFTER `workflow_id`;

-- 新增系统日志表
CREATE TABLE IF NOT EXISTS `system_logs` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `level` VARCHAR(10) NOT NULL,
  `module` VARCHAR(100) NOT NULL,
  `message` TEXT NOT NULL,
  `details` JSON NULL,
  `workflow_id` INT NULL,
  `workflow_type` VARCHAR(50) NULL,
  `event_id` VARCHAR(100) NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
  INDEX `idx_log_level` (`level`),
  INDEX `idx_log_module` (`module`),
  INDEX `idx_log_workflow` (`workflow_id`)
);

-- 新增公告表
CREATE TABLE IF NOT EXISTS `announcements` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `content` TEXT NOT NULL,
  `target` VARCHAR(50) DEFAULT 'all' NOT NULL,
  `status` VARCHAR(20) DEFAULT 'draft' NOT NULL,
  `priority` VARCHAR(20) DEFAULT 'normal' NOT NULL,
  `publish_time` DATETIME NULL,
  `level` VARCHAR(20) DEFAULT 'info' NOT NULL,
  `read_count` INT DEFAULT 0,
  `creator_id` INT NULL,
  `creator_name` VARCHAR(100) NULL,
  `attachments` JSON NULL,
  `metadata` JSON NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_announcement_status` (`status`),
  INDEX `idx_announcement_priority` (`priority`)
);

