-- Templates additional columns (idempotent)
ALTER TABLE `templates`
  ADD COLUMN IF NOT EXISTS `type` VARCHAR(50) NOT NULL DEFAULT 'article' AFTER `style`,
  ADD COLUMN IF NOT EXISTS `is_default` TINYINT(1) NOT NULL DEFAULT 0 AFTER `is_active`,
  ADD COLUMN IF NOT EXISTS `preview_url` VARCHAR(1000) NULL AFTER `is_default`;

-- Data source extended metadata (fallback for legacy rows)
ALTER TABLE `data_sources`
  ADD COLUMN IF NOT EXISTS `name` VARCHAR(255) NOT NULL DEFAULT '' AFTER `id`,
  ADD COLUMN IF NOT EXISTS `type` VARCHAR(50) NOT NULL DEFAULT 'custom' AFTER `name`,
  ADD COLUMN IF NOT EXISTS `url` VARCHAR(1000) NULL AFTER `identifier`,
  ADD COLUMN IF NOT EXISTS `enabled` TINYINT(1) NOT NULL DEFAULT 1 AFTER `url`,
  ADD COLUMN IF NOT EXISTS `status` VARCHAR(20) NOT NULL DEFAULT 'active' AFTER `enabled`,
  ADD COLUMN IF NOT EXISTS `description` TEXT NULL AFTER `status`,
  ADD COLUMN IF NOT EXISTS `config` JSON NULL AFTER `description`,
  ADD COLUMN IF NOT EXISTS `last_sync_at` DATETIME NULL AFTER `config`,
  ADD COLUMN IF NOT EXISTS `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- Content workflow linkage
ALTER TABLE `content`
  ADD COLUMN IF NOT EXISTS `metadata` JSON NULL AFTER `tags`,
  ADD COLUMN IF NOT EXISTS `workflow_id` INT NULL AFTER `publish_date`,
  ADD COLUMN IF NOT EXISTS `workflow_type` VARCHAR(50) NULL AFTER `workflow_id`,
  ADD COLUMN IF NOT EXISTS `workflow_event_id` VARCHAR(100) NULL AFTER `workflow_type`;

-- Publish history event id
ALTER TABLE `publish_history`
  ADD COLUMN IF NOT EXISTS `event_id` VARCHAR(100) NULL AFTER `workflow_id`;

-- System logs table (create if missing)
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

-- Announcements table (create if missing)
CREATE TABLE IF NOT EXISTS `announcements` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `content` TEXT NOT NULL,
  `target` VARCHAR(50) DEFAULT 'all' NOT NULL,
  `status` VARCHAR(20) DEFAULT 'draft' NOT NULL,
  `priority` VARCHAR(20) DEFAULT 'medium' NOT NULL,
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

-- Ensure utf8mb4 so emojis可写
ALTER TABLE `content` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE `publish_history` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE `system_logs` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE `announcements` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

