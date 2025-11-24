import db from "@src/db/db.ts";
import { dataSources } from "@src/db/schema.ts";
import { eq, desc } from "drizzle-orm";

export interface DataSourceInput {
  name: string;
  type: string;
  url: string;
  description?: string;
  enabled?: boolean;
  status?: string;
  config?: Record<string, unknown>;
}

export interface DataSourceRecord extends DataSourceInput {
  id: number;
  identifier?: string | null;
  platform?: string | null;
  lastSyncAt?: string | null;
  updatedAt?: string;
  createdAt?: string;
}

function mapRow(row: any): DataSourceRecord {
  const fallbackName = row.name || row.identifier || `数据源 #${row.id}`;
  const fallbackType = row.type || row.platform || "custom";
  const fallbackUrl = row.url || row.identifier || "";

  return {
    id: Number(row.id),
    name: fallbackName,
    type: fallbackType,
    url: fallbackUrl,
    description: row.description ?? "",
    enabled: Boolean(row.enabled ?? 1),
    status: row.status ?? "active",
    config: row.config ?? {},
    identifier: row.identifier,
    platform: row.platform,
    lastSyncAt: row.lastSyncAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function listDataSources(): Promise<DataSourceRecord[]> {
  const rows = await db.select().from(dataSources).orderBy(desc(dataSources.id));
  return rows.map(mapRow);
}

export async function getDataSourceById(id: number): Promise<DataSourceRecord | null> {
  const rows = await db.select().from(dataSources).where(eq(dataSources.id, id)).limit(1);
  if (rows.length === 0) return null;
  return mapRow(rows[0]);
}

export async function createDataSource(
  input: DataSourceInput,
): Promise<DataSourceRecord> {
  await db.insert(dataSources).values({
    name: input.name,
    type: input.type,
    url: input.url,
    description: input.description ?? "",
    enabled: input.enabled ? 1 : 0,
    status: input.status ?? "active",
    config: input.config ?? {},
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const latest = await db.select().from(dataSources).orderBy(desc(dataSources.id)).limit(1);
  return mapRow(latest[0]);
}

export async function updateDataSource(
  id: number,
  input: Partial<DataSourceInput>,
): Promise<DataSourceRecord> {
  const payload: Record<string, unknown> = {
    updatedAt: new Date(),
  };

  if (input.name !== undefined) payload.name = input.name;
  if (input.type !== undefined) payload.type = input.type;
  if (input.url !== undefined) payload.url = input.url;
  if (input.description !== undefined) payload.description = input.description;
  if (input.enabled !== undefined) payload.enabled = input.enabled ? 1 : 0;
  if (input.status !== undefined) payload.status = input.status;
  if (input.config !== undefined) payload.config = input.config;

  await db.update(dataSources)
    .set(payload)
    .where(eq(dataSources.id, id));

  const updated = await getDataSourceById(id);
  if (!updated) {
    throw new Error("数据源不存在");
  }
  return updated;
}

export async function deleteDataSource(id: number): Promise<void> {
  await db.delete(dataSources).where(eq(dataSources.id, id));
}

export async function toggleDataSource(id: number, enabled: boolean) {
  await db.update(dataSources)
    .set({
      enabled: enabled ? 1 : 0,
      updatedAt: new Date(),
    })
    .where(eq(dataSources.id, id));
  const record = await getDataSourceById(id);
  if (!record) throw new Error("数据源不存在");
  return record;
}

export async function markDataSourceSynced(id: number) {
  await db.update(dataSources)
    .set({
      lastSyncAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(dataSources.id, id));
  return await getDataSourceById(id);
}

