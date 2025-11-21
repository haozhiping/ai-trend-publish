import { login, getUserInfo } from "@src/services/auth.service.ts";
import { extractTokenFromHeader } from "@src/utils/auth/jwt.ts";

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

// 用户登录
export async function handleLogin(request: Request): Promise<Response> {
  try {
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

