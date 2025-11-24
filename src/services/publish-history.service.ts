import db from "@src/db/db.ts";
import { publishHistory } from "@src/db/schema.ts";
import { and, eq, gte, lte, desc, sql, like } from "drizzle-orm";
import { formatBeijingDateTime } from "@src/utils/time.util.ts";

export interface PublishHistoryFilter {
  keyword?: string;
  platform?: string;
  status?: string;
  workflowType?: string;
  startTime?: string;
  endTime?: string;
  page?: number;
  pageSize?: number;
}

export interface PublishHistoryRecord {
  id: number;
  title: string;
  platform: string;
  status: string;
  publishTime: string;
  url?: string | null;
  articleCount: number;
  successCount: number;
  failCount: number;
  workflowType?: string | null;
  workflowId?: number | null;
  errorMessage?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface PublishHistoryResponse {
  items: PublishHistoryRecord[];
  total: number;
  page: number;
  pageSize: number;
}

function buildFilters(filter: PublishHistoryFilter) {
  const conditions = [];
  if (filter.keyword) {
    conditions.push(like(publishHistory.title, `%${filter.keyword}%`));
  }
  if (filter.platform) {
    conditions.push(eq(publishHistory.platform, filter.platform));
  }
  if (filter.status) {
    conditions.push(eq(publishHistory.status, filter.status));
  }
  if (filter.workflowType) {
    conditions.push(eq(publishHistory.workflowType, filter.workflowType));
  }
  if (filter.startTime) {
    conditions.push(gte(publishHistory.publishTime, filter.startTime));
  }
  if (filter.endTime) {
    conditions.push(lte(publishHistory.publishTime, filter.endTime));
  }
  return conditions;
}

function mapRecord(row: any): PublishHistoryRecord {
  return {
    id: Number(row.id),
    title: row.title,
    platform: row.platform,
    status: row.status,
    publishTime: formatBeijingDateTime(row.publishTime) ?? "",
    url: row.url,
    articleCount: row.articleCount ?? 0,
    successCount: row.successCount ?? 0,
    failCount: row.failCount ?? 0,
    workflowType: row.workflowType,
    workflowId: row.workflowId,
    errorMessage: row.errorMessage,
    metadata: row.metadata,
  };
}

export async function listPublishHistory(
  filter: PublishHistoryFilter,
): Promise<PublishHistoryResponse> {
  const page = filter.page ?? 1;
  const pageSize = filter.pageSize ?? 10;
  const offset = (page - 1) * pageSize;

  const conditions = buildFilters(filter);
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const rows = await db.select()
    .from(publishHistory)
    .where(whereClause)
    .orderBy(desc(publishHistory.publishTime))
    .limit(pageSize)
    .offset(offset);

  const totalResult = await db.select({ count: sql<number>`count(*)` })
    .from(publishHistory)
    .where(whereClause);

  return {
    items: rows.map(mapRecord),
    total: totalResult[0]?.count ?? 0,
    page,
    pageSize,
  };
}

