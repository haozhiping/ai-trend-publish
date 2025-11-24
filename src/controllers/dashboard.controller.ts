import { ensureAuthenticated } from "@src/controllers/helpers/auth.ts";
import { getDashboardOverview } from "@src/services/dashboard.service.ts";

function respond(body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

export async function handleGetDashboardOverview(req: Request): Promise<Response> {
  const auth = await ensureAuthenticated(req);
  if (auth.response) return auth.response;

  const url = new URL(req.url);
  const rangeDaysParam = url.searchParams.get("rangeDays");
  const rangeDays = rangeDaysParam ? Number(rangeDaysParam) : undefined;

  const data = await getDashboardOverview(rangeDays ?? 7);
  return respond({
    code: 200,
    message: "获取仪表盘数据成功",
    data,
  });
}

