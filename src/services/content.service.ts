import db from "@src/db/db.ts";
import { content } from "@src/db/schema.ts";
import { eq, desc } from "drizzle-orm";
import { Logger } from "@zilla/logger";

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
}

export async function getContentList(): Promise<ContentListItem[]> {
  const rows = await db
    .select()
    .from(content)
    .orderBy(desc(content.publishDate ?? content.createdAt));

  return rows.map((row) => {
    let keywords: string[] = [];
    if (row.keywords) {
      try {
        keywords = Array.isArray(row.keywords)
          ? row.keywords as string[]
          : JSON.parse(String(row.keywords));
      } catch {
        keywords = [];
      }
    }

    const publishDate = row.publishDate
      ? new Date(row.publishDate as unknown as Date).toISOString().replace("T", " ").substring(0, 19)
      : null;

    return {
      id: row.id as number,
      title: row.title,
      content: row.summary ?? row.content ?? "",
      url: row.url ?? null,
      source: row.source,
      platform: row.platform ?? null,
      publishDate,
      score: (row.score as number | null) ?? null,
      status: row.status,
      keywords,
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
  const [row] = rows;

  const list = await getContentList();
  return list.find((item) => item.id === row.id) ?? null;
}

export async function deleteContent(id: number): Promise<void> {
  await db.delete(content).where(eq(content.id, id));
  logger.info(`删除内容: ${id}`);
}


