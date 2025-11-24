import { extractTokenFromHeader, verifyToken } from "@src/utils/auth/jwt.ts";
import {
  getSystemStatus,
  refreshSystemStatus,
  requestSystemRestart,
} from "@src/services/system.service.ts";

interface AuthResult {
  authorized: boolean;
  response?: Response;
}

async function ensureAuthorized(req: Request): Promise<AuthResult> {
  const authHeader = req.headers.get("Authorization");
  const token = extractTokenFromHeader(authHeader);
  if (!token) {
    return {
      authorized: false,
      response: new Response(
        JSON.stringify({
          code: 401,
          message: "未授权，请先登录",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        },
      ),
    };
  }

  const payload = await verifyToken(token);
  if (!payload) {
    return {
      authorized: false,
      response: new Response(
        JSON.stringify({
          code: 401,
          message: "Token 无效或已过期",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        },
      ),
    };
  }

  return { authorized: true };
}

export async function handleGetSystemStatus(req: Request): Promise<Response> {
  try {
    const auth = await ensureAuthorized(req);
    if (!auth.authorized) {
      return auth.response!;
    }

    return new Response(
      JSON.stringify({
        code: 200,
        message: "获取系统状态成功",
        data: getSystemStatus(),
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("获取系统状态失败:", error);
    return new Response(
      JSON.stringify({
        code: 500,
        message: "获取系统状态失败",
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}

export async function handleRefreshSystem(req: Request): Promise<Response> {
  try {
    const auth = await ensureAuthorized(req);
    if (!auth.authorized) {
      return auth.response!;
    }

    const updatedStatus = refreshSystemStatus();
    return new Response(
      JSON.stringify({
        code: 200,
        message: "系统状态已刷新",
        data: updatedStatus,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("刷新系统状态失败:", error);
    return new Response(
      JSON.stringify({
        code: 500,
        message: "刷新系统状态失败",
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}

export async function handleRestartSystem(req: Request): Promise<Response> {
  try {
    const auth = await ensureAuthorized(req);
    if (!auth.authorized) {
      return auth.response!;
    }

    const result = requestSystemRestart();
    return new Response(
      JSON.stringify({
        code: 200,
        message: result.message,
        data: result.status,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("重启系统失败:", error);
    return new Response(
      JSON.stringify({
        code: 500,
        message: "重启系统失败",
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}

