import { verifyToken } from "@src/utils/auth/jwt.ts";

export interface AuthResult {
  payload?: Record<string, any>;
  response?: Response;
}

export async function ensureAuthenticated(req: Request): Promise<AuthResult> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return {
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

  const token = authHeader.split(" ")[1];
  const payload = await verifyToken(token);
  if (!payload) {
    return {
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

  return { payload };
}

