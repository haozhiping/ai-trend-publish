import {
  createTemplate,
  deleteTemplate,
  listTemplates,
  setTemplateDefault,
  updateTemplate,
} from "@src/services/template.service.ts";
import { ensureAuthenticated } from "@src/controllers/helpers/auth.ts";

export async function handleGetTemplates(req: Request): Promise<Response> {
  const auth = await ensureAuthenticated(req);
  if (auth.response) return auth.response;

  const data = await listTemplates();
  return jsonResponse({ code: 200, message: "获取模板成功", data });
}

export async function handleCreateTemplate(req: Request): Promise<Response> {
  const auth = await ensureAuthenticated(req);
  if (auth.response) return auth.response;

  const body = await req.json();
  const template = await createTemplate(body);
  return jsonResponse({ code: 200, message: "模板创建成功", data: template });
}

export async function handleUpdateTemplate(
  req: Request,
  id: string,
): Promise<Response> {
  const auth = await ensureAuthenticated(req);
  if (auth.response) return auth.response;

  const body = await req.json();
  const template = await updateTemplate(Number(id), body);
  return jsonResponse({ code: 200, message: "模板更新成功", data: template });
}

export async function handleDeleteTemplate(
  req: Request,
  id: string,
): Promise<Response> {
  const auth = await ensureAuthenticated(req);
  if (auth.response) return auth.response;

  await deleteTemplate(Number(id));
  return jsonResponse({ code: 200, message: "模板已删除" });
}

export async function handleSetDefaultTemplate(
  req: Request,
  id: string,
): Promise<Response> {
  const auth = await ensureAuthenticated(req);
  if (auth.response) return auth.response;

  await setTemplateDefault(Number(id));
  return jsonResponse({ code: 200, message: "默认模板已更新" });
}

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

