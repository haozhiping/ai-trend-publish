import { login, getUserInfo } from "@src/services/auth.service.ts";
import { extractTokenFromHeader } from "@src/utils/auth/jwt.ts";
import { formatBeijingDateTime } from "@src/utils/time.util.ts";

// 统一响应格式
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
    timestamp: formatBeijingDateTime(new Date()) ?? undefined,
  };
}

function errorResponse(message: string, code = 400): ApiResponse {
  return {
    code,
    message,
    timestamp: formatBeijingDateTime(new Date()) ?? undefined,
  };
}

// 用户登录
export async function handleLogin(request: Request): Promise<Response> {
  try {
    // 检查是否使用主系统登录
    const useMainSystemAuth = Deno.env.get("USE_MAIN_SYSTEM_AUTH") !== "false"; // 默认true
    
    if (useMainSystemAuth) {
      // 如果配置为使用主系统登录，则不允许子系统独立登录
      return new Response(
        JSON.stringify(errorResponse("当前系统已配置为主系统登录，请通过主系统登录", 403)),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
    
    const body = await request.json();
    const result = await login(body);
    
    return new Response(
      JSON.stringify(successResponse(result, "登录成功")),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "登录失败";
    return new Response(
      JSON.stringify(errorResponse(message, 401)),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

// 获取用户信息
export async function handleGetUser(request: Request): Promise<Response> {
  try {
    const authHeader = request.headers.get("Authorization");
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return new Response(
        JSON.stringify(errorResponse("未授权", 401)),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const userInfo = await getUserInfo(token);
    
    if (!userInfo) {
      return new Response(
        JSON.stringify(errorResponse("用户不存在或Token无效", 401)),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify(successResponse(userInfo)),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "获取用户信息失败";
    return new Response(
      JSON.stringify(errorResponse(message, 500)),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

// 用户登出
export async function handleLogout(request: Request): Promise<Response> {
  // 登出主要是前端清除 token，后端不需要特殊处理
  return new Response(
    JSON.stringify(successResponse(null, "登出成功")),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
}

// 验证主系统token（SSO登录）
export async function handleVerifyMainToken(request: Request): Promise<Response> {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return new Response(
        JSON.stringify(errorResponse("缺少token", 400)),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 验证主系统token（使用主系统的JWT_SECRET）
    const { verifyMainSystemToken } = await import("@src/utils/auth/jwt.ts");
    const payload = await verifyMainSystemToken(token);

    if (!payload) {
      return new Response(
        JSON.stringify(errorResponse("Token无效或已过期", 401)),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 检查工作流系统中是否存在该用户，如果不存在则创建
    const { syncUserFromMainSystem } = await import("@src/services/auth.service.ts");
    const userInfo = await syncUserFromMainSystem(payload);

    return new Response(
      JSON.stringify(successResponse({
        userId: userInfo.id,
        username: userInfo.username,
        name: userInfo.name,
        role: userInfo.role,
        user: userInfo,
      }, "验证成功")),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "验证失败";
    return new Response(
      JSON.stringify(errorResponse(message, 500)),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

