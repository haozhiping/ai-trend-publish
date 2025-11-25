/**
 * 授权码系统数据库表定义
 */
import { mysqlTable, int, varchar, datetime, text, decimal, index, primaryKey, unique } from "drizzle-orm/mysql-core";
import { licenses, systems, banners, paymentConfigs, orders } from "./schema-license-generated.ts";

// 重新导出（如果文件不存在，这里会报错，需要先运行 SQL 生成）
export { licenses, systems, banners, paymentConfigs, orders };

