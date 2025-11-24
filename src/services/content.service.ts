import db from "@src/db/db.ts";
import { content } from "@src/db/schema.ts";
import { desc, eq } from "drizzle-orm";
import { Logger } from "@zilla/logger";
import { formatBeijingDateTime } from "@src/utils/time.util.ts";

const logger = new Logger("ContentService");

export interface ContentListItem {
  id: number;
  title: string;
  content: string;
  url: string | null;
  source: string;
  platform: string | null;
  publishDate: string | null;
  score: number | null;
  status: string;
  keywords: string[];
  summary: string | null;
  tags: string[];
}

interface ContentUpdatePayload {
  title?: string | null;
  summary?: string | null;
  content?: string | null;
  url?: string | null;
  source?: string | null;
  platform?: string | null;
  status?: string | null;
  publishDate?: string | null;
  score?: number | null;
  keywords?: string[] | null;
  tags?: string[] | null;
}

function parseJsonArray(raw: unknown): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw as string[];
  }
  try {
    const parsed = JSON.parse(String(raw));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function getContentList(): Promise<ContentListItem[]> {
  const rows = await db
    .select()
    .from(content)
    .orderBy(desc(content.publishDate ?? content.createdAt));

  return rows.map((row) => {
    const keywords = parseJsonArray(row.keywords);
    const tags = parseJsonArray(row.tags);

    const publishDate = formatBeijingDateTime(row.publishDate);

    return {
      id: row.id as number,
      title: row.title,
      content: row.summary ?? row.content ?? "",
      summary: row.summary ?? null,
      url: row.url ?? null,
      source: row.source,
      platform: row.platform ?? null,
      publishDate,
      score: (row.score as number | null) ?? null,
      status: row.status,
      keywords,
      tags,
    };
  });
}

export async function getContentById(id: number): Promise<ContentListItem | null> {
  const rows = await db
    .select()
    .from(content)
    .where(eq(content.id, id))
    .limit(1);

  if (rows.length === 0) return null;

  const row = rows[0];
  const keywords = parseJsonArray(row.keywords);
  const tags = parseJsonArray(row.tags);
  const publishDate = formatBeijingDateTime(row.publishDate);

  return {
    id: row.id as number,
    title: row.title,
    content: row.summary ?? row.content ?? "",
    summary: row.summary ?? null,
    url: row.url ?? null,
    source: row.source,
    platform: row.platform ?? null,
    publishDate,
    score: (row.score as number | null) ?? null,
    status: row.status,
    keywords,
    tags,
  };
}

export async function deleteContent(id: number): Promise<void> {
  await db.delete(content).where(eq(content.id, id));
  logger.info(`删除内容: ${id}`);
}

export async function updateContentById(id: number, payload: ContentUpdatePayload): Promise<void> {
  const updateData: Record<string, any> = {};

  if (payload.title !== undefined) {
    updateData.title = payload.title;
  }
  if (payload.summary !== undefined) {
    updateData.summary = payload.summary;
  }
  if (payload.content !== undefined) {
    updateData.content = payload.content;
  }
  if (payload.url !== undefined) {
    updateData.url = payload.url;
  }
  if (payload.source !== undefined) {
    updateData.source = payload.source;
  }
  if (payload.platform !== undefined) {
    updateData.platform = payload.platform;
  }
  if (payload.status !== undefined) {
    updateData.status = payload.status;
  }
  if (payload.score !== undefined) {
    updateData.score = payload.score;
  }
  if (payload.publishDate !== undefined) {
    updateData.publishDate = payload.publishDate ? new Date(payload.publishDate) : null;
  }
  if (payload.keywords !== undefined) {
    updateData.keywords = payload.keywords ? JSON.stringify(payload.keywords) : null;
  }
  if (payload.tags !== undefined) {
    updateData.tags = payload.tags ? JSON.stringify(payload.tags) : null;
  }

  if (Object.keys(updateData).length === 0) {
    return;
  }

  await db.update(content).set(updateData).where(eq(content.id, id));
  logger.info(`更新内容: ${id}`);
}