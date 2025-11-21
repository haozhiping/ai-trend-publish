-- 数据库初始化脚本
-- 如果表已存在则忽略错误

CREATE TABLE IF NOT EXISTS `config` (
	`id` int AUTO_INCREMENT NOT NULL,
	`key` varchar(255),
	`value` varchar(255),
	CONSTRAINT `config_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `data_sources` (
	`id` int AUTO_INCREMENT NOT NULL,
	`platform` varchar(255),
	`identifier` varchar(255),
	CONSTRAINT `data_sources_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`platform` varchar(50) NOT NULL,
	`style` varchar(50) NOT NULL,
	`content` text NOT NULL,
	`schema` json,
	`example_data` json,
	`is_active` tinyint DEFAULT 1,
	`created_at` timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
	`created_by` int,
	CONSTRAINT `templates_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `template_categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`template_id` int NOT NULL,
	`category` varchar(50) NOT NULL,
	CONSTRAINT `template_categories_id` PRIMARY KEY(`id`),
	CONSTRAINT `template_categories_template_id_templates_id_fk` FOREIGN KEY (`template_id`) REFERENCES `templates`(`id`) ON DELETE cascade,
	INDEX `idx_template_id` (`template_id`)
);

CREATE TABLE IF NOT EXISTS `template_versions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`template_id` int NOT NULL,
	`version` varchar(20) NOT NULL,
	`content` text NOT NULL,
	`schema` json,
	`changes` text,
	`created_at` timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`created_by` int,
	CONSTRAINT `template_versions_id` PRIMARY KEY(`id`),
	CONSTRAINT `template_versions_template_id_templates_id_fk` FOREIGN KEY (`template_id`) REFERENCES `templates`(`id`) ON DELETE cascade,
	INDEX `idx_template_id` (`template_id`)
);

CREATE TABLE IF NOT EXISTS `vector_items` (
	`id` bigint NOT NULL,
	`content` text,
	`vector` json,
	`vector_dim` int,
	`vector_type` varchar(20),
	CONSTRAINT `vector_items_id` PRIMARY KEY(`id`)
);

