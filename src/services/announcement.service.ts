import db from "@src/db/db.ts";
import { announcements } from "@src/db/schema.ts";
import { eq, desc } from "drizzle-orm";

export interface AnnouncementInput {
  title: string;
  content: string;
  target?: string;
  priority?: string;
  level?: string;
  status?: "draft" | "published";
  publishTime?: string | Date;
  creatorId?: number;
  creatorName?: string;
  attachments?: Record<string, unknown>;
}

export interface AnnouncementRecord extends AnnouncementInput {
  id: number;
  readCount: number;
  metadata?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

function mapAnnouncement(row: any): AnnouncementRecord {
  return {
    id: Number(row.id),
    title: row.title,
    content: row.content,
    target: row.target,
    priority: row.priority,
    level: row.level,
    status: row.status,
    publishTime: row.publishTime,
    creatorId: row.creatorId,
    creatorName: row.creatorName,
    readCount: row.readCount ?? 0,
    attachments: row.attachments,
    metadata: row.metadata,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function listAnnouncements(): Promise<AnnouncementRecord[]> {
  const rows = await db.select().from(announcements).orderBy(desc(announcements.publishTime));
  return rows.map(mapAnnouncement);
}

export async function createAnnouncement(
  input: AnnouncementInput,
): Promise<AnnouncementRecord> {
  const publishTime = input.publishTime
    ? new Date(input.publishTime)
    : new Date();

  await db.insert(announcements).values({
    title: input.title,
    content: input.content,
    target: input.target ?? "all",
    priority: input.priority ?? "medium",
    level: input.level ?? "info",
    status: input.status ?? "draft",
    publishTime,
    creatorId: input.creatorId ?? null,
    creatorName: input.creatorName ?? "",
    attachments: input.attachments ?? {},
  });

  const latest = await db.select().from(announcements).orderBy(desc(announcements.id)).limit(1);
  return mapAnnouncement(latest[0]);
}

export async function updateAnnouncement(
  id: number,
  input: Partial<AnnouncementInput>,
): Promise<AnnouncementRecord> {
  const payload: Record<string, unknown> = {
    updatedAt: new Date(),
  };
  if (input.title !== undefined) payload.title = input.title;
  if (input.content !== undefined) payload.content = input.content;
  if (input.target !== undefined) payload.target = input.target;
  if (input.priority !== undefined) payload.priority = input.priority;
  if (input.level !== undefined) payload.level = input.level;
  if (input.status !== undefined) payload.status = input.status;
  if (input.publishTime !== undefined) {
    payload.publishTime = input.publishTime
      ? new Date(input.publishTime)
      : null;
  }
  if (input.attachments !== undefined) payload.attachments = input.attachments;
  if (input.creatorId !== undefined) payload.creatorId = input.creatorId;
  if (input.creatorName !== undefined) payload.creatorName = input.creatorName;

  await db.update(announcements)
    .set(payload)
    .where(eq(announcements.id, id));

  const updated = await getAnnouncementById(id);
  if (!updated) throw new Error("公告不存在");
  return updated;
}

export async function getAnnouncementById(
  id: number,
): Promise<AnnouncementRecord | null> {
  const rows = await db.select().from(announcements).where(eq(announcements.id, id)).limit(1);
  if (rows.length === 0) return null;
  return mapAnnouncement(rows[0]);
}

export async function deleteAnnouncement(id: number): Promise<void> {
  await db.delete(announcements).where(eq(announcements.id, id));
}

export async function publishAnnouncement(id: number) {
  await db.update(announcements)
    .set({
      status: "published",
      publishTime: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(announcements.id, id));
}

export async function unpublishAnnouncement(id: number) {
  await db.update(announcements)
    .set({
      status: "draft",
      updatedAt: new Date(),
    })
    .where(eq(announcements.id, id));
}

