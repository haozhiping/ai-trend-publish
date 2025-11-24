import {
  clearSystemLogs,
  exportSystemLogs,
  listSystemLogs,
} from "@src/services/system-log.service.ts";
import { ensureAuthenticated } from "@src/controllers/helpers/auth.ts";

export async function handleGetSystemLogs(req: Request): Promise<Response> {
  const auth = await ensureAuthenticated(req);
  if (auth.response) return auth.response;

  const url = new URL(req.url);
  const data = await listSystemLogs({
    level: url.searchParams.get("level") ?? undefined,
    module: url.searchParams.get("module") ?? undefined,
    keyword: url.searchParams.get("keyword") ?? undefined,
    startTime: url.searchParams.get("startTime") ?? undefined,
    endTime: url.searchParams.get("endTime") ?? undefined,
    page: url.searchParams.get("page")
      ? Number(url.searchParams.get("page"))
      : undefined,
    pageSize: url.searchParams.get("pageSize")
      ? Number(url.searchParams.get("pageSize"))
      : undefined,
  });

  return jsonResponse({
    code: 200,
    message: "获取系统日志成功",
    data,
  });
}

export async function handleClearSystemLogs(req: Request): Promise<Response> {
  const auth = await ensureAuthenticated(req);
  if (auth.response) return auth.response;

  await clearSystemLogs();
  return jsonResponse({ code: 200, message: "系统日志已清空" });
}

export async function handleExportSystemLogs(req: Request): Promise<Response> {
  const auth = await ensureAuthenticated(req);
  if (auth.response) return auth.response;

  const url = new URL(req.url);
  const content = await exportSystemLogs({
    level: url.searchParams.get("level") ?? undefined,
    module: url.searchParams.get("module") ?? undefined,
    keyword: url.searchParams.get("keyword") ?? undefined,
  });

  return new Response(content, {
    status: 200,
    headers: {
      "Content-Type": "text/plain",
      "Content-Disposition": `attachment; filename="system-logs-${Date.now()}.txt"`,
    },
  });
}

function jsonResponse(body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

