import {
  deleteContent,
  getContentById,
  getContentList,
  updateContentById,
} from "@src/services/content.service.ts";
import { extractTokenFromHeader, verifyToken } from "@src/utils/auth/jwt.ts";

interface ApiResponse<T = any> {
  code: number;
  message: string;
  data?: T;
  timestamp?: string;
}

function successResponse<T>(data: T, message = "操作成功"): ApiResponse<T> {
  return {
    code: 200,
    message,
    data,
    timestamp: new Date().toISOString(),
  };
}

function errorResponse(message: string, code = 400): ApiResponse {
  return {
    code,
    message,
    timestamp: new Date().toISOString(),
  };
}

async function verifyAuth(request: Request): Promise<{ userId?: number } | null> {
  const authHeader = request.headers.get("Authorization");
  const token = extractTokenFromHeader(authHeader);
  if (!token) return null;

  const payload = await verifyToken(token);
  return payload ? { userId: payload.userId } : null;
}

export async function handleGetContents(request: Request): Promise<Response> {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return new Response(JSON.stringify(errorResponse("未授权", 401)), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const list = await getContentList();
    return new Response(JSON.stringify(successResponse(list)), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "获取内容列表失败";
    return new Response(JSON.stringify(errorResponse(message, 500)), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function handleGetContent(request: Request, id: string): Promise<Response> {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return new Response(JSON.stringify(errorResponse("未授权", 401)), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const item = await getContentById(Number(id));
    if (!item) {
      return new Response(JSON.stringify(errorResponse("内容不存在", 404)), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(successResponse(item)), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "获取内容详情失败";
    return new Response(JSON.stringify(errorResponse(message, 500)), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function handleDeleteContent(request: Request, id: string): Promise<Response> {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return new Response(JSON.stringify(errorResponse("未授权", 401)), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    await deleteContent(Number(id));
    return new Response(JSON.stringify(successResponse(null, "内容已删除")), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "删除内容失败";
    return new Response(JSON.stringify(errorResponse(message, 500)), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function handleUpdateContent(
  request: Request,
  id: string,
): Promise<Response> {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return new Response(JSON.stringify(errorResponse("未授权", 401)), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const payload = await request.json();
    if (!payload || typeof payload !== "object") {
      return new Response(JSON.stringify(errorResponse("参数错误", 400)), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    await updateContentById(Number(id), payload);

    return new Response(JSON.stringify(successResponse(null, "内容更新成功")), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "更新内容失败";
    return new Response(JSON.stringify(errorResponse(message, 500)), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}


