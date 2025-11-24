import { listPublishHistory } from "@src/services/publish-history.service.ts";
import { ensureAuthenticated } from "@src/controllers/helpers/auth.ts";

export async function handleGetPublishHistory(
  req: Request,
): Promise<Response> {
  const auth = await ensureAuthenticated(req);
  if (auth.response) return auth.response;

  const url = new URL(req.url);
  const data = await listPublishHistory({
    keyword: url.searchParams.get("keyword") ?? undefined,
    platform: url.searchParams.get("platform") ?? undefined,
    status: url.searchParams.get("status") ?? undefined,
    workflowType: url.searchParams.get("workflowType") ?? undefined,
    startTime: url.searchParams.get("startTime") ?? undefined,
    endTime: url.searchParams.get("endTime") ?? undefined,
    page: url.searchParams.get("page")
      ? Number(url.searchParams.get("page"))
      : undefined,
    pageSize: url.searchParams.get("pageSize")
      ? Number(url.searchParams.get("pageSize"))
      : undefined,
  });

  return new Response(
    JSON.stringify({
      code: 200,
      message: "获取发布记录成功",
      data,
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    },
  );
}

