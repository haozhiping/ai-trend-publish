import {
  createDataSource,
  deleteDataSource,
  listDataSources,
  markDataSourceSynced,
  updateDataSource,
  toggleDataSource,
} from "@src/services/data-source.service.ts";
import { ensureAuthenticated } from "@src/controllers/helpers/auth.ts";

export async function handleGetDataSources(req: Request): Promise<Response> {
  const auth = await ensureAuthenticated(req);
  if (auth.response) return auth.response;

  const data = await listDataSources();
  return respond({ code: 200, message: "获取数据源成功", data });
}

export async function handleCreateDataSource(req: Request): Promise<Response> {
  const auth = await ensureAuthenticated(req);
  if (auth.response) return auth.response;

  const body = await req.json();
  const record = await createDataSource(body);
  return respond({ code: 200, message: "数据源创建成功", data: record });
}

export async function handleUpdateDataSource(
  req: Request,
  id: string,
): Promise<Response> {
  const auth = await ensureAuthenticated(req);
  if (auth.response) return auth.response;

  const body = await req.json();
  const record = await updateDataSource(Number(id), body);
  return respond({ code: 200, message: "数据源更新成功", data: record });
}

export async function handleToggleDataSource(
  req: Request,
  id: string,
): Promise<Response> {
  const auth = await ensureAuthenticated(req);
  if (auth.response) return auth.response;

  const body = await req.json();
  const record = await toggleDataSource(Number(id), Boolean(body.enabled));
  return respond({ code: 200, message: "数据源状态已更新", data: record });
}

export async function handleDeleteDataSource(
  req: Request,
  id: string,
): Promise<Response> {
  const auth = await ensureAuthenticated(req);
  if (auth.response) return auth.response;

  await deleteDataSource(Number(id));
  return respond({ code: 200, message: "数据源已删除" });
}

export async function handleTestDataSource(
  req: Request,
  id: string,
): Promise<Response> {
  const auth = await ensureAuthenticated(req);
  if (auth.response) return auth.response;
  const body = await req.json().catch(() => ({}));
  const success = body?.simulateSuccess ?? true;
  return respond({
    code: success ? 200 : 500,
    message: success ? "连接测试成功" : "连接测试失败",
  }, success ? 200 : 500);
}

export async function handleSyncDataSource(
  req: Request,
  id: string,
): Promise<Response> {
  const auth = await ensureAuthenticated(req);
  if (auth.response) return auth.response;

  const record = await markDataSourceSynced(Number(id));
  return respond({ code: 200, message: "数据源同步成功", data: record });
}

function respond(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

