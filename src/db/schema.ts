import { mysqlTable, mysqlSchema, AnyMySqlColumn, primaryKey, int, varchar, index, foreignKey, text, json, timestamp, bigint, tinyint, double } from "drizzle-orm/mysql-core"
import { sql } from "drizzle-orm"

export const config = mysqlTable("config", {
	id: int().autoincrement().notNull(),
	key: varchar({ length: 255 }),
	value: varchar({ length: 255 }),
},
(table) => [
	primaryKey({ columns: [table.id], name: "config_id"}),
]);

export const dataSources = mysqlTable("data_sources", {
	id: int().autoincrement().notNull(),
	platform: varchar({ length: 255 }),
	identifier: varchar({ length: 255 }),
},
(table) => [
	primaryKey({ columns: [table.id], name: "data_sources_id"}),
]);

export const templateCategories = mysqlTable("template_categories", {
	id: int().autoincrement().notNull(),
	templateId: int("template_id").notNull().references(() => templates.id, { onDelete: "cascade" } ),
	category: varchar({ length: 50 }).notNull(),
},
(table) => [
	index("idx_template_id").on(table.templateId),
	primaryKey({ columns: [table.id], name: "template_categories_id"}),
]);

export const templateVersions = mysqlTable("template_versions", {
	id: int().autoincrement().notNull(),
	templateId: int("template_id").notNull().references(() => templates.id, { onDelete: "cascade" } ),
	version: varchar({ length: 20 }).notNull(),
	content: text().notNull(),
	schema: json(),
	changes: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	createdBy: int("created_by"),
},
(table) => [
	index("idx_template_id").on(table.templateId),
	primaryKey({ columns: [table.id], name: "template_versions_id"}),
]);

export const templates = mysqlTable("templates", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	platform: varchar({ length: 50 }).notNull(),
	style: varchar({ length: 50 }).notNull(),
	content: text().notNull(),
	schema: json(),
	exampleData: json("example_data"),
	isActive: tinyint("is_active").default(1),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
	createdBy: int("created_by"),
},
(table) => [
	primaryKey({ columns: [table.id], name: "templates_id"}),
]);

// 内容表（内容库）
export const content = mysqlTable("content", {
	id: bigint({ mode: "number" }).autoincrement().notNull(),
	title: varchar({ length: 500 }).notNull(),
	content: text(),
	summary: text(),
	url: varchar({ length: 1000 }),
	source: varchar({ length: 50 }).notNull(),
	platform: varchar({ length: 50 }),
	score: double("score"),
	keywords: json(),
	tags: json(),
	status: varchar({ length: 20 }).default("draft").notNull(),
	publishDate: timestamp("publish_date", { mode: "date" }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "content_id"}),
	index("idx_source").on(table.source),
	index("idx_status").on(table.status),
	index("idx_publish_date").on(table.publishDate),
]);

export const vectorItems = mysqlTable("vector_items", {
	id: bigint({ mode: "number" }).notNull(),
	content: text(),
	vector: json(),
	vectorDim: int("vector_dim"),
	vectorType: varchar("vector_type", { length: 20 }),
},
(table) => [
	primaryKey({ columns: [table.id], name: "vector_items_id"}),
]);

export const users = mysqlTable("users", {
	id: int().autoincrement().notNull(),
	username: varchar({ length: 50 }).notNull(),
	password: varchar({ length: 255 }).notNull(),
	email: varchar({ length: 100 }),
	name: varchar({ length: 100 }),
	avatar: varchar({ length: 255 }),
	role: varchar({ length: 20 }).default("user").notNull(),
	permissions: json(),
	status: tinyint().default(1).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
	lastLoginAt: timestamp("last_login_at", { mode: 'date' }),
},
(table) => [
	primaryKey({ columns: [table.id], name: "users_id"}),
	index("idx_username").on(table.username),
	index("idx_email").on(table.email),
]);

export const workflows = mysqlTable("workflows", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 255 }).notNull(),
	type: varchar({ length: 50 }).notNull(),
	description: text(),
	status: varchar({ length: 20 }).default("stopped").notNull(),
	schedule: varchar({ length: 100 }),
	config: json(),
	lastRun: timestamp("last_run", { mode: 'date' }),
	nextRun: timestamp("next_run", { mode: 'date' }),
	runCount: int("run_count").default(0),
	successCount: int("success_count").default(0),
	failCount: int("fail_count").default(0),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
	createdBy: int("created_by"),
},
(table) => [
	primaryKey({ columns: [table.id], name: "workflows_id"}),
	index("idx_type").on(table.type),
	index("idx_status").on(table.status),
]);

export const publishHistory = mysqlTable("publish_history", {
	id: bigint({ mode: "number" }).autoincrement().notNull(),
	title: varchar({ length: 500 }).notNull(),
	platform: varchar({ length: 50 }).notNull(),
	status: varchar({ length: 20 }).notNull(),
	publishTime: timestamp("publish_time", { mode: 'string' }).notNull(),
	url: varchar({ length: 1000 }),
	articleCount: int("article_count").default(0),
	successCount: int("success_count").default(0),
	failCount: int("fail_count").default(0),
	workflowType: varchar("workflow_type", { length: 50 }),
	workflowId: int("workflow_id"),
	errorMessage: text("error_message"),
	metadata: json(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "publish_history_id"}),
	index("idx_platform").on(table.platform),
	index("idx_status").on(table.status),
	index("idx_publish_time").on(table.publishTime),
	index("idx_workflow_type").on(table.workflowType),
]);