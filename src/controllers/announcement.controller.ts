import {
  createAnnouncement,
  deleteAnnouncement,
  listAnnouncements,
  publishAnnouncement,
  unpublishAnnouncement,
  updateAnnouncement,
} from "@src/services/announcement.service.ts";
import { ensureAuthenticated } from "@src/controllers/helpers/auth.ts";

export async function handleGetAnnouncements(req: Request): Promise<Response> {
  const auth = await ensureAuthenticated(req);
  if (auth.response) return auth.response;

  const data = await listAnnouncements();
  return respond({ code: 200, message: "获取公告成功", data });
}

export async function handleCreateAnnouncement(req: Request): Promise<Response> {
  const auth = await ensureAuthenticated(req);
  if (auth.response) return auth.response;

  const body = await req.json();
  const record = await createAnnouncement(body);
  return respond({ code: 200, message: "公告创建成功", data: record });
}

export async function handleUpdateAnnouncement(
  req: Request,
  id: string,
): Promise<Response> {
  const auth = await ensureAuthenticated(req);
  if (auth.response) return auth.response;

  const body = await req.json();
  const record = await updateAnnouncement(Number(id), body);
  return respond({ code: 200, message: "公告更新成功", data: record });
}

export async function handleDeleteAnnouncement(
  req: Request,
  id: string,
): Promise<Response> {
  const auth = await ensureAuthenticated(req);
  if (auth.response) return auth.response;

  await deleteAnnouncement(Number(id));
  return respond({ code: 200, message: "公告已删除" });
}

export async function handlePublishAnnouncement(
  req: Request,
  id: string,
): Promise<Response> {
  const auth = await ensureAuthenticated(req);
  if (auth.response) return auth.response;

  await publishAnnouncement(Number(id));
  return respond({ code: 200, message: "公告已发布" });
}

export async function handleUnpublishAnnouncement(
  req: Request,
  id: string,
): Promise<Response> {
  const auth = await ensureAuthenticated(req);
  if (auth.response) return auth.response;

  await unpublishAnnouncement(Number(id));
  return respond({ code: 200, message: "公告已撤回" });
}

function respond(body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

