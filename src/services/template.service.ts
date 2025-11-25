import db from "@src/db/db.ts";
import { templates } from "@src/db/schema.ts";
import { eq, desc, and } from "drizzle-orm";
import {
  formatBeijingDateTime,
  getBeijingNow,
} from "@src/utils/time.util.ts";

export interface TemplateInput {
  name: string;
  type: string;
  description?: string;
  previewUrl?: string;
  content: string;
  isDefault?: boolean;
  style?: string;
  platform?: string;
}

export interface TemplateRecord extends TemplateInput {
  id: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

function mapTemplate(row: any): TemplateRecord {
  return {
    id: Number(row.id),
    name: row.name,
    type: row.type,
    description: row.description ?? "",
    previewUrl: row.previewUrl ?? "",
    content: row.content,
    isDefault: Boolean(row.isDefault),
    isActive: Boolean(row.isActive),
    style: row.style,
    platform: row.platform,
    createdAt: formatBeijingDateTime(row.createdAt) ?? undefined,
    updatedAt: formatBeijingDateTime(row.updatedAt) ?? undefined,
  };
}

export async function listTemplates(): Promise<TemplateRecord[]> {
  const rows = await db.select().from(templates).orderBy(desc(templates.createdAt));
  return rows.map(mapTemplate);
}

export async function getTemplateById(id: number): Promise<TemplateRecord | null> {
  const rows = await db.select().from(templates).where(eq(templates.id, id)).limit(1);
  if (rows.length === 0) return null;
  return mapTemplate(rows[0]);
}

export async function createTemplate(input: TemplateInput): Promise<TemplateRecord> {
  await db.insert(templates).values({
    name: input.name,
    type: input.type,
    description: input.description ?? "",
    previewUrl: input.previewUrl ?? "",
    content: input.content,
    isDefault: input.isDefault ? 1 : 0,
    style: input.style ?? "default",
    platform: input.platform ?? "weixin",
    createdAt: getBeijingNow(),
    updatedAt: getBeijingNow(),
  });

  if (input.isDefault) {
    await setDefaultTemplateByType(input.type);
  }

  const latest = await db.select().from(templates).orderBy(desc(templates.id)).limit(1);
  return mapTemplate(latest[0]);
}

export async function updateTemplate(
  id: number,
  input: Partial<TemplateInput>,
): Promise<TemplateRecord> {
  const payload: Record<string, unknown> = {
    updatedAt: getBeijingNow(),
  };

  if (input.name !== undefined) payload.name = input.name;
  if (input.type !== undefined) payload.type = input.type;
  if (input.description !== undefined) payload.description = input.description;
  if (input.previewUrl !== undefined) payload.previewUrl = input.previewUrl;
  if (input.content !== undefined) payload.content = input.content;
  if (input.style !== undefined) payload.style = input.style;
  if (input.platform !== undefined) payload.platform = input.platform;
  if (input.isDefault !== undefined) payload.isDefault = input.isDefault ? 1 : 0;

  await db.update(templates).set(payload).where(eq(templates.id, id));

  if (input.isDefault) {
    const template = await getTemplateById(id);
    if (template) {
      await setDefaultTemplateByType(template.type);
    }
  }

  const updated = await getTemplateById(id);
  if (!updated) throw new Error("模板不存在");
  return updated;
}

export async function deleteTemplate(id: number): Promise<void> {
  await db.delete(templates).where(eq(templates.id, id));
}

export async function setTemplateDefault(id: number): Promise<void> {
  const template = await getTemplateById(id);
  if (!template) {
    throw new Error("模板不存在");
  }
  await setDefaultTemplateByType(template.type, id);
}

async function setDefaultTemplateByType(type: string, idToKeep?: number) {
  // 先将该类型的所有模板清除默认标记
  await db.update(templates)
    .set({ isDefault: 0 })
    .where(eq(templates.type, type));

  if (idToKeep) {
    await db.update(templates)
      .set({ isDefault: 1, updatedAt: getBeijingNow() })
      .where(and(eq(templates.type, type), eq(templates.id, idToKeep)));
  }
}

export async function getDefaultTemplateByType(type: string): Promise<TemplateRecord | null> {
  const rows = await db
    .select()
    .from(templates)
    .where(and(eq(templates.type, type), eq(templates.isDefault, 1)))
    .limit(1);
  
  if (rows.length === 0) {
    // 如果没有默认模板，返回该类型的第一个模板
    const fallbackRows = await db
      .select()
      .from(templates)
      .where(eq(templates.type, type))
      .orderBy(desc(templates.createdAt))
      .limit(1);
    if (fallbackRows.length === 0) return null;
    return mapTemplate(fallbackRows[0]);
  }
  
  return mapTemplate(rows[0]);
}

