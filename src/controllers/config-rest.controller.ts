import { getAllConfigs, updateConfigs } from "@src/services/config.service.ts";
import { verifyToken } from "@src/utils/auth/jwt.ts";

/**
 * 获取所有系统配置
 * GET /api/config
 */
export async function handleGetConfig(req: Request): Promise<Response> {
  try {
    // 验证 JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({
          code: 401,
          message: "未授权，请先登录",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const token = authHeader.split(" ")[1];
    const payload = await verifyToken(token);
    if (!payload) {
      return new Response(
        JSON.stringify({
          code: 401,
          message: "Token 无效或已过期",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const configs = await getAllConfigs();

    return new Response(
      JSON.stringify({
        code: 200,
        message: "获取配置成功",
        data: configs,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("获取配置失败:", error);
    return new Response(
      JSON.stringify({
        code: 500,
        message: "获取配置失败",
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

/**
 * 更新系统配置
 * PUT /api/config
 */
export async function handleUpdateConfig(req: Request): Promise<Response> {
  try {
    // 验证 JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({
          code: 401,
          message: "未授权，请先登录",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const token = authHeader.split(" ")[1];
    const payload = await verifyToken(token);
    if (!payload) {
      return new Response(
        JSON.stringify({
          code: 401,
          message: "Token 无效或已过期",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const body = await req.json();
    const configs = body.configs || body;

    if (!configs || typeof configs !== "object") {
      return new Response(
        JSON.stringify({
          code: 400,
          message: "配置数据格式错误",
          timestamp: new Date().toISOString(),
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    await updateConfigs(configs);

    return new Response(
      JSON.stringify({
        code: 200,
        message: "配置已保存",
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("更新配置失败:", error);
    return new Response(
      JSON.stringify({
        code: 500,
        message: "更新配置失败",
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

