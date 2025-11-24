import db from "@src/db/db.ts";
import {
  content,
  publishHistory,
  systemLogs,
} from "@src/db/schema.ts";
import { eq, and } from "drizzle-orm";
import { WorkflowRunResult } from "@src/works/workflow-recorder.ts";
import { Logger } from "@zilla/logger";
import { formatBeijingDateTime } from "@src/utils/time.util.ts";

const logger = new Logger("WorkflowRecordService");

export interface WorkflowDbInfo {
  id: number;
  type: string;
  name?: string;
}

export async function persistWorkflowResult(
  workflow: WorkflowDbInfo,
  result?: WorkflowRunResult,
) {
  if (!result) {
    logger.warn(
      `[persistWorkflowResult] workflow ${workflow.id} 没有可保存的执行结果`,
    );
    return;
  }

  await saveContents(workflow, result);
  await savePublishHistory(workflow, result);
  await saveSystemLogs(workflow, result);
}

function normalizeDate(value?: string | number | Date | null): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

async function saveContents(
  workflow: WorkflowDbInfo,
  result: WorkflowRunResult,
) {
  for (const item of result.contents) {
    try {
      const url = item.url ?? null;
      const source = item.source || "unknown";

      let existingId: number | undefined;
      if (url) {
        const existingByUrl = await db.select({ id: content.id })
          .from(content)
          .where(eq(content.url, url))
          .limit(1);
        if (existingByUrl.length > 0) {
          existingId = Number(existingByUrl[0].id);
        }
      }

      if (!existingId) {
        const existingByTitle = await db.select({ id: content.id })
          .from(content)
          .where(and(
            eq(content.title, item.title),
            eq(content.source, source),
          ))
          .limit(1);
        if (existingByTitle.length > 0) {
          existingId = Number(existingByTitle[0].id);
        }
      }

      const now = new Date();
      const payload = {
        title: item.title,
        content: item.content ?? null,
        summary: item.summary ?? null,
        url,
        source,
        platform: item.platform ?? "weixin",
        score: item.score ?? null,
        keywords: item.keywords?.length ? item.keywords : null,
        tags: item.tags?.length ? item.tags : null,
        metadata: item.metadata ?? null,
        status: item.status ?? "draft",
        publishDate: normalizeDate(item.publishDate),
        workflowId: workflow.id,
        workflowType: workflow.type,
        workflowEventId: result.eventId,
        updatedAt: now,
      };

      if (existingId) {
        await db.update(content)
          .set(payload)
          .where(eq(content.id, existingId));
      } else {
        await db.insert(content).values({
          ...payload,
          createdAt: now,
        });
      }
    } catch (error) {
      logger.error("[persistWorkflowResult] 保存内容失败", error);
    }
  }
}

function buildLogMetadata(result: WorkflowRunResult, limit = 30) {
  const logs = result.logs
    .slice(-limit)
    .map((log) =>
      `[${formatBeijingDateTime(log.timestamp)}][${
        log.level.toUpperCase()
      }] ${log.module} :: ${log.message}${
        log.details ? ` ${JSON.stringify(log.details)}` : ""
      }`
    );
  return logs;
}

async function savePublishHistory(
  workflow: WorkflowDbInfo,
  result: WorkflowRunResult,
) {
  for (const record of result.publishes) {
    try {
      const articleCount = record.articleCount ?? record.successCount ?? 0;
      const computedSuccess = record.status === "published"
        ? (record.successCount ?? articleCount)
        : 0;
      const computedFail = record.status === "failed"
        ? (record.failCount ?? articleCount - computedSuccess)
        : Math.max(articleCount - computedSuccess, 0);
      const logMetadata = buildLogMetadata(result);
      const detailedLogs = result.logs.slice(-200).map((log) => ({
        timestamp: formatBeijingDateTime(log.timestamp),
        level: log.level,
        module: log.module,
        message: log.message,
        details: log.details ?? null,
      }));

      const publishTime = normalizeDate(
        record.publishTime ?? result.finishedAt ?? Date.now(),
      ) ?? new Date();
      await db.insert(publishHistory).values({
        title: record.title,
        platform: record.platform,
        status: record.status,
        publishTime,
        url: record.url ?? null,
        articleCount,
        successCount: computedSuccess,
        failCount: computedFail,
        workflowType: workflow.type,
        workflowId: workflow.id,
        eventId: result.eventId,
        errorMessage: record.errorMessage ?? null,
        metadata: {
          ...record.metadata,
          logs: logMetadata,
          rawLogs: detailedLogs,
        },
        createdAt: new Date(),
      });
    } catch (error) {
      logger.error("[persistWorkflowResult] 保存发布记录失败", error);
    }
  }
}

async function saveSystemLogs(
  workflow: WorkflowDbInfo,
  result: WorkflowRunResult,
) {
  const logs = result.logs.length > 0
    ? result.logs
    : [{
      timestamp: Date.now(),
      level: result.status === "success" ? "info" : "error",
      module: workflow.type,
      message: `工作流 ${workflow.name || workflow.type} ${
        result.status === "success" ? "执行成功" : "执行失败"
      }`,
      details: result.error ? { error: result.error } : undefined,
    }];

  for (const log of logs) {
    try {
      await db.insert(systemLogs).values({
        level: log.level,
        module: log.module,
        message: log.message,
        details: log.details ?? null,
        workflowId: workflow.id,
        workflowType: workflow.type,
        eventId: result.eventId,
        createdAt: normalizeDate(log.timestamp) ?? new Date(),
      });
    } catch (error) {
      logger.error("[persistWorkflowResult] 保存系统日志失败", error);
    }
  }
}

