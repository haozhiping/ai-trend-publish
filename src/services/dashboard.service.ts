import db from "@src/db/db.ts";
import {
  announcements,
  content,
  dataSources,
  publishHistory,
  systemLogs,
  workflows,
} from "@src/db/schema.ts";
import { desc, sql } from "drizzle-orm";
type SystemInformationModule = typeof import("npm:systeminformation");

let systemInformationModule: SystemInformationModule | null = null;

async function getSystemInformation(): Promise<SystemInformationModule> {
  if (!systemInformationModule) {
    systemInformationModule = await import("npm:systeminformation");
  }
  return systemInformationModule;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function formatDateLabel(date: Date) {
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function toDate(value: string | Date | null): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export interface DashboardOverview {
  metrics: {
    totalArticles: number;
    todayPublished: number;
    successRate: number;
    totalViews: number;
    activeWorkflows: number;
  };
  chart: {
    rangeDays: number;
    points: Array<{
      name: string;
      date: string;
      articles: number;
      views: number;
      success: number;
    }>;
  };
  platformDistribution: Array<{ name: string; platform: string; value: number }>;
  recentActivities: Array<{
    id: string;
    title: string;
    description: string;
    status: "success" | "warning" | "error" | "info";
    time: string;
    module: string;
  }>;
  apiQuotas: Array<{
    id: number;
    name: string;
    type: string;
    used: number;
    amount: string;
    status: string;
    trend: number;
  }>;
  systemResources: {
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
  };
  workflowStatus: Array<{
    id: number;
    name: string;
    status: string;
    nextRun?: string | null;
  }>;
  health: {
    score: number;
    level: string;
    message: string;
  };
  announcements: Array<{
    id: number;
    title: string;
    content: string;
    type: "info" | "success" | "warning" | "error";
    publishTime?: string | null;
    priority: string;
  }>;
}

export async function getDashboardOverview(
  rangeDays = 7,
): Promise<DashboardOverview> {
  const normalizedRange = Math.min(Math.max(rangeDays, 7), 90);
  const now = new Date();
  const rangeStart = new Date(now.getTime() - (normalizedRange - 1) * DAY_MS);

  const [
    articleStats,
    publishStats,
    workflowStats,
    historyRows,
    platformRows,
    logRows,
    dataSourceRows,
    workflowRows,
    announcementRows,
  ] = await Promise.all([
    db.select({
      totalArticles: sql<number>`count(*)`,
    }).from(content),
    db.select({
      todayPublished: sql<number>`
        sum(case when DATE(publish_time) = CURRENT_DATE() then 1 else 0 end)
      `,
      successCount: sql<number>`
        sum(case when status = 'published' then 1 else 0 end)
      `,
      totalPublishes: sql<number>`count(*)`,
      totalArticlePieces: sql<number>`coalesce(sum(article_count), 0)`,
    }).from(publishHistory),
    db.select({
      activeWorkflows: sql<number>`
        sum(case when status = 'running' then 1 else 0 end)
      `,
    }).from(workflows),
    db.select({
      id: publishHistory.id,
      publishTime: publishHistory.publishTime,
      articleCount: publishHistory.articleCount,
      successCount: publishHistory.successCount,
      failCount: publishHistory.failCount,
      platform: publishHistory.platform,
      status: publishHistory.status,
      title: publishHistory.title,
    })
      .from(publishHistory)
      .orderBy(desc(publishHistory.publishTime))
      .limit(400),
    db.select({
      platform: publishHistory.platform,
      articleCount: publishHistory.articleCount,
    })
      .from(publishHistory),
    db.select({
      id: systemLogs.id,
      level: systemLogs.level,
      module: systemLogs.module,
      message: systemLogs.message,
      createdAt: systemLogs.createdAt,
    })
      .from(systemLogs)
      .orderBy(desc(systemLogs.createdAt))
      .limit(8),
    db.select({
      id: dataSources.id,
      name: dataSources.name,
      type: dataSources.type,
      status: dataSources.status,
      enabled: dataSources.enabled,
      description: dataSources.description,
      config: dataSources.config,
    })
      .from(dataSources)
      .orderBy(desc(dataSources.updatedAt))
      .limit(8),
    db.select({
      id: workflows.id,
      name: workflows.name,
      status: workflows.status,
      nextRun: workflows.nextRun,
    })
      .from(workflows)
      .orderBy(desc(workflows.updatedAt))
      .limit(6),
    db.select({
      id: announcements.id,
      title: announcements.title,
      content: announcements.content,
      status: announcements.status,
      priority: announcements.priority,
      publishTime: announcements.publishTime,
    })
      .from(announcements)
      .orderBy(desc(announcements.publishTime))
      .limit(5),
  ]);

  const metrics = {
    totalArticles: articleStats[0]?.totalArticles ?? 0,
    todayPublished: publishStats[0]?.todayPublished ?? 0,
    successRate: (() => {
      const total = publishStats[0]?.totalPublishes ?? 0;
      if (!total) return 0;
      const success = publishStats[0]?.successCount ?? 0;
      return Number(((success / total) * 100).toFixed(1));
    })(),
    totalViews: publishStats[0]?.totalArticlePieces ?? 0,
    activeWorkflows: workflowStats[0]?.activeWorkflows ?? 0,
  };

  const chartPoints: DashboardOverview["chart"]["points"] = [];
  for (let i = normalizedRange - 1; i >= 0; i--) {
    const date = new Date(now.getTime() - i * DAY_MS);
    const key = date.toISOString().slice(0, 10);
    chartPoints.push({
      name: formatDateLabel(date),
      date: key,
      articles: 0,
      views: 0,
      success: 0,
    });
  }

  const chartIndex = new Map(chartPoints.map((point) => [point.date, point]));
  historyRows.forEach((row) => {
    const date = toDate(row.publishTime);
    if (!date || date < rangeStart) return;
    const key = date.toISOString().slice(0, 10);
    const target = chartIndex.get(key);
    if (!target) return;
    const articles = row.articleCount ?? 0;
    target.articles += articles;
    target.success += row.successCount ?? 0;
    target.views += articles * 120; // 估算阅读量：每篇文章约 120 次浏览
  });

  const platformTotals = new Map<string, number>();
  platformRows.forEach((row) => {
    const platform = row.platform || "unknown";
    const current = platformTotals.get(platform) ?? 0;
    platformTotals.set(platform, current + (row.articleCount ?? 0));
  });
  const platformDistribution = Array.from(platformTotals.entries()).map(
    ([platform, total]) => ({
      name: platform,
      platform,
      value: total,
    }),
  );
  const platformSum = platformDistribution.reduce(
    (sum, item) => sum + item.value,
    0,
  );
  if (platformSum > 0) {
    platformDistribution.forEach((item) => {
      item.value = Number(((item.value / platformSum) * 100).toFixed(1));
    });
  }

  const levelMap: Record<string, "success" | "warning" | "error" | "info"> = {
    info: "info",
    debug: "info",
    warn: "warning",
    warning: "warning",
    error: "error",
    success: "success",
  };

  const recentActivities = logRows.map((log) => {
    const message = log.message ?? "";
    const moduleName = log.module ?? "系统";
    return {
      id: String(log.id),
      title: moduleName,
      description: message.slice(0, 120),
      status: levelMap[log.level?.toLowerCase()] ?? "info",
      time: log.createdAt ?? "",
      module: moduleName,
    };
  });

  const apiQuotas = dataSourceRows.map((ds) => {
    const config = (ds.config ?? {}) as Record<string, unknown>;
    const usagePercent = typeof config.usagePercent === "number"
      ? config.usagePercent
      : undefined;
    const usage = usagePercent !== undefined
      ? Math.min(Math.max(usagePercent, 0), 100)
      : ds.status === "warning"
      ? 85
      : ds.status === "error"
      ? 95
      : ds.enabled ? 45 : 10;
    return {
      id: ds.id,
      name: ds.name,
      type: ds.type,
      used: usage,
      amount: (config.remaining as string) ?? ds.description ?? "-",
      status: ds.status,
      trend: typeof config.trend === "number" ? config.trend : 0,
    };
  });

  const si = await getSystemInformation();
  const [currentLoad, memory, disks] = await Promise.all([
    si.currentLoad().catch(() => ({ currentLoad: 0 })),
    si.mem().catch(() => ({ used: 0, total: 1 })),
    si.fsSize().catch(() => []),
  ]);

  const rawCpuLoad = Number(
    (currentLoad as { currentLoad?: number; currentload?: number }).currentLoad ??
      (currentLoad as { currentload?: number }).currentload ??
      0,
  );
  const cpuUsage = Math.min(100, Math.max(0, Math.round(rawCpuLoad)));
  const memoryUsage = memory.total
    ? Math.min(100, Math.round((memory.used / memory.total) * 100))
    : 0;
  const diskUsage = disks.length
    ? Math.min(
      100,
      Math.round(
        (disks.reduce((sum, d) => sum + d.used, 0) /
            disks.reduce((sum, d) => sum + d.size, 0)) * 100,
      ),
    )
    : 0;

  const systemResources = {
    cpuUsage,
    memoryUsage,
    diskUsage,
  };

  const workflowStatus = workflowRows.map((row) => ({
    id: row.id,
    name: row.name,
    status: row.status,
    nextRun: row.nextRun ?? null,
  }));

  const resourceLoad = cpuUsage * 0.4 + memoryUsage * 0.4 + diskUsage * 0.2;
  const healthScore = Math.max(
    0,
    Math.min(
      100,
      Math.round(metrics.successRate * 0.6 + (100 - resourceLoad) * 0.4),
    ),
  );
  const health = {
    score: healthScore,
    level: healthScore >= 85
      ? "优秀"
      : healthScore >= 60
      ? "良好"
      : "告警",
    message: healthScore >= 60 ? "系统运行稳定" : "请检查系统资源与发布成功率",
  };

  const announcementList = announcementRows
    .filter((item) => item.status === "published")
    .map((item) => ({
      id: item.id,
      title: item.title,
      content: item.content,
      type: item.priority === "high"
        ? "warning"
        : item.priority === "urgent"
        ? "error"
        : "info",
      publishTime: item.publishTime,
      priority: item.priority,
    }));

  return {
    metrics,
    chart: {
      rangeDays: normalizedRange,
      points: chartPoints,
    },
    platformDistribution,
    recentActivities,
    apiQuotas,
    systemResources,
    workflowStatus,
    health,
    announcements: announcementList,
  };
}

