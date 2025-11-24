export type WorkflowLogLevel = "debug" | "info" | "warn" | "error";

export interface RecordedContent {
  title: string;
  content?: string | null;
  summary?: string | null;
  url?: string | null;
  source: string;
  platform?: string | null;
  score?: number | null;
  keywords?: string[];
  tags?: string[];
  status?: string;
  publishDate?: string | Date | null;
  metadata?: Record<string, unknown>;
}

export interface RecordedPublish {
  title: string;
  platform: string;
  status: string;
  publishTime: string | Date;
  url?: string | null;
  articleCount?: number;
  successCount?: number;
  failCount?: number;
  errorMessage?: string | null;
  metadata?: Record<string, unknown>;
}

export interface RecordedLog {
  timestamp: number;
  level: WorkflowLogLevel;
  module: string;
  message: string;
  details?: Record<string, unknown> | string | null;
}

export interface WorkflowRunResult {
  workflowId: string;
  eventId: string;
  startedAt: number;
  finishedAt: number;
  status: "success" | "failure";
  error?: string;
  contents: RecordedContent[];
  publishes: RecordedPublish[];
  logs: RecordedLog[];
}

export class WorkflowRecorder {
  private readonly workflowId: string;
  private readonly eventId: string;
  private readonly startedAt: number;
  private finishedAt: number;
  private status: "success" | "failure" = "success";
  private error?: string;

  private readonly contents: RecordedContent[] = [];
  private readonly publishes: RecordedPublish[] = [];
  private readonly logs: RecordedLog[] = [];

  constructor(workflowId: string, eventId: string) {
    this.workflowId = workflowId;
    this.eventId = eventId;
    this.startedAt = Date.now();
    this.finishedAt = this.startedAt;
  }

  addContent(content: RecordedContent) {
    this.contents.push({
      ...content,
      keywords: content.keywords ?? [],
      tags: content.tags ?? [],
    });
  }

  addPublish(record: RecordedPublish) {
    this.publishes.push({
      ...record,
    });
  }

  addLog(
    log: Omit<RecordedLog, "timestamp"> & { timestamp?: number },
  ) {
    this.logs.push({
      timestamp: log.timestamp ?? Date.now(),
      level: log.level,
      module: log.module,
      message: log.message,
      details: log.details,
    });
  }

  setFailure(error: string) {
    this.status = "failure";
    this.error = error;
  }

  finalize(): WorkflowRunResult {
    this.finishedAt = Date.now();
    return {
      workflowId: this.workflowId,
      eventId: this.eventId,
      startedAt: this.startedAt,
      finishedAt: this.finishedAt,
      status: this.status,
      error: this.error,
      contents: [...this.contents],
      publishes: [...this.publishes],
      logs: [...this.logs],
    };
  }
}

