import db from "@src/db/db.ts";
import { systemLogs } from "@src/db/schema.ts";
import { and, eq, gte, lte, desc, sql, like } from "drizzle-orm";

export interface SystemLogFilter {
  level?: string;
  module?: string;
  keyword?: string;
  startTime?: string;
  endTime?: string;
  page?: number;
  pageSize?: number;
}

export interface SystemLogRecord {
  id: number;
  level: string;
  module: string;
  message: string;
  details?: Record<string, unknown> | null;
  workflowId?: number | null;
  workflowType?: string | null;
  eventId?: string | null;
  createdAt: string;
}

export interface SystemLogResponse {
  items: SystemLogRecord[];
  total: number;
  page: number;
  pageSize: number;
}

function buildConditions(filter: SystemLogFilter) {
  const conditions = [];
  if (filter.level) {
    conditions.push(eq(systemLogs.level, filter.level));
  }
  if (filter.module) {
    conditions.push(eq(systemLogs.module, filter.module));
  }
  if (filter.keyword) {
    conditions.push(like(systemLogs.message, `%${filter.keyword}%`));
  }
  if (filter.startTime) {
    conditions.push(gte(systemLogs.createdAt, filter.startTime));
  }
  if (filter.endTime) {
    conditions.push(lte(systemLogs.createdAt, filter.endTime));
  }
  return conditions;
}

function mapLog(row: any): SystemLogRecord {
  return {
    id: Number(row.id),
    level: row.level,
    module: row.module,
    message: row.message,
    details: row.details,
    workflowId: row.workflowId,
    workflowType: row.workflowType,
    eventId: row.eventId,
    createdAt: row.createdAt,
  };
}

export async function listSystemLogs(
  filter: SystemLogFilter,
): Promise<SystemLogResponse> {
  const page = filter.page ?? 1;
  const pageSize = filter.pageSize ?? 20;
  const offset = (page - 1) * pageSize;
  const conditions = buildConditions(filter);
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const rows = await db.select()
    .from(systemLogs)
    .where(whereClause)
    .orderBy(desc(systemLogs.createdAt))
    .limit(pageSize)
    .offset(offset);

  const totalResult = await db.select({ count: sql<number>`count(*)` })
    .from(systemLogs)
    .where(whereClause);

  return {
    items: rows.map(mapLog),
    total: totalResult[0]?.count ?? 0,
    page,
    pageSize,
  };
}

export async function clearSystemLogs() {
  await db.delete(systemLogs);
}

export async function exportSystemLogs(
  filter: SystemLogFilter,
): Promise<string> {
  const logs = await listSystemLogs({ ...filter, page: 1, pageSize: 1000 });
  return logs.items.map((log) =>
    `[${log.createdAt}] [${log.level.toUpperCase()}] [${log.module}] ${
      log.message
    }`
  ).join("\n");
}

