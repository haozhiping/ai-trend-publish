import { triggerWorkflow } from "./controllers/workflow.controller.ts";
import { WorkflowType } from "./controllers/cron.ts";
import { ConfigManager } from "@src/utils/config/config-manager.ts";
import { handleLogin, handleGetUser, handleLogout } from "./controllers/auth.controller.ts";
import {
  handleGetWorkflows,
  handleGetWorkflow,
  handleCreateWorkflow,
  handleUpdateWorkflow,
  handleDeleteWorkflow,
  handleStartWorkflow,
  handleStopWorkflow,
  handleExecuteWorkflow,
} from "./controllers/workflow-rest.controller.ts";
import { handleGetContents, handleGetContent, handleDeleteContent } from "./controllers/content-rest.controller.ts";
import {
  handleGetConfig,
  handleUpdateConfig,
} from "./controllers/config-rest.controller.ts";
import {
  handleGetSystemStatus,
  handleRefreshSystem,
  handleRestartSystem,
} from "./controllers/system-rest.controller.ts";
import { initializeWorkflows } from "./services/workflow.service.ts";


export interface JSONRPCRequest {
  jsonrpc: string;
  method: string;
  params: Record<string, any>;
  id: string | number;
}

export interface JSONRPCResponse {
  jsonrpc: string;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
  id: string | number;
}

export class JSONRPCServer {
  private routes: Record<string, (params: Record<string, any>) => Promise<any>>;

  constructor() {
    this.routes = {};
  }


  registerRoute(method: string, handler: (params: Record<string, any>) => Promise<any>) {
    this.routes[method] = handler;
  }

  async handleRequest(request: Request): Promise<Response> {
    try {
      if (request.method !== "POST") {
        throw new Error("只支持 POST 请求");
      }

      const body = await request.json() as JSONRPCRequest;

      if (!body.jsonrpc || body.jsonrpc !== "2.0") {
        throw new Error("无效的 JSON-RPC 请求");
      }

      if (!body.method) {
        throw new Error("请求缺少方法名");
      }

      const handler = this.routes[body.method];
      if (!handler) {
        throw new Error(`方法 ${body.method} 不存在`);
      }

      const result = await handler(body.params || {});
      
      return new Response(
        JSON.stringify({
          jsonrpc: "2.0",
          result,
          id: body.id,
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    } catch (error) {
      const isClientError = error instanceof Error && (
        error.message.includes("无效的") ||
        error.message.includes("不存在") ||
        error.message.includes("缺少")
      );

      return new Response(
        JSON.stringify({
          jsonrpc: "2.0",
          error: {
            code: isClientError ? -32600 : -32603,
            message: isClientError ? error.message : "内部服务器错误",
            data: {
              error: error instanceof Error ? error.message : String(error),
            },
          },
          id: "unknown",
        }),
        {
          status: isClientError ? 400 : 500,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }
  }
}

// 创建 JSON-RPC 服务器实例
const rpcServer = new JSONRPCServer();
rpcServer.registerRoute("triggerWorkflow", triggerWorkflow);

// CORS 响应头
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// 处理 OPTIONS 请求（CORS 预检）
function handleOptions(): Response {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}

// REST API 路由处理
async function handleRestApi(req: Request, path: string): Promise<Response | null> {
  const method = req.method;
  const pathParts = path.split("/").filter(p => p);

  // 认证相关接口（不需要 JWT 验证）
  if (pathParts[0] === "api" && pathParts[1] === "auth") {
    if (pathParts[2] === "login" && method === "POST") {
      return await handleLogin(req);
    }
    if (pathParts[2] === "user" && method === "GET") {
      return await handleGetUser(req);
    }
    if (pathParts[2] === "logout" && method === "POST") {
      return await handleLogout(req);
    }
  }

  // 工作流管理接口
  if (pathParts[0] === "api" && pathParts[1] === "workflows") {
    if (method === "GET" && pathParts.length === 2) {
      // GET /api/workflows
      return await handleGetWorkflows(req);
    }
    if (method === "POST" && pathParts.length === 2) {
      // POST /api/workflows
      return await handleCreateWorkflow(req);
    }
    if (method === "GET" && pathParts.length === 3) {
      // GET /api/workflows/:id
      return await handleGetWorkflow(req, pathParts[2]);
    }
    if (method === "PUT" && pathParts.length === 3) {
      // PUT /api/workflows/:id
      return await handleUpdateWorkflow(req, pathParts[2]);
    }
    if (method === "DELETE" && pathParts.length === 3) {
      // DELETE /api/workflows/:id
      return await handleDeleteWorkflow(req, pathParts[2]);
    }
    if (method === "POST" && pathParts.length === 4) {
      // POST /api/workflows/:id/start
      if (pathParts[3] === "start") {
        return await handleStartWorkflow(req, pathParts[2]);
      }
      // POST /api/workflows/:id/stop
      if (pathParts[3] === "stop") {
        return await handleStopWorkflow(req, pathParts[2]);
      }
      // POST /api/workflows/:id/execute
      if (pathParts[3] === "execute") {
        return await handleExecuteWorkflow(req, pathParts[2]);
      }
    }
  }

  // 内容库接口
  if (pathParts[0] === "api" && pathParts[1] === "content") {
    if (method === "GET" && pathParts.length === 2) {
      // GET /api/content
      return await handleGetContents(req);
    }
    if (method === "GET" && pathParts.length === 3) {
      // GET /api/content/:id
      return await handleGetContent(req, pathParts[2]);
    }
    if (method === "PUT" && pathParts.length === 3) {
      // PUT /api/content/:id
      return await handleUpdateContent(req, pathParts[2]);
    }
    if (method === "DELETE" && pathParts.length === 3) {
      // DELETE /api/content/:id
      return await handleDeleteContent(req, pathParts[2]);
    }
  }

  // 系统配置接口
  if (pathParts[0] === "api" && pathParts[1] === "config") {
    if (method === "GET" && pathParts.length === 2) {
      // GET /api/config
      return await handleGetConfig(req);
    }
    if (method === "PUT" && pathParts.length === 2) {
      // PUT /api/config
      return await handleUpdateConfig(req);
    }
  }

  // 系统控制接口
  if (pathParts[0] === "api" && pathParts[1] === "system") {
    if (method === "GET" && pathParts.length === 3 && pathParts[2] === "status") {
      return await handleGetSystemStatus(req);
    }
    if (method === "POST" && pathParts.length === 3 && pathParts[2] === "refresh") {
      return await handleRefreshSystem(req);
    }
    if (method === "POST" && pathParts.length === 3 && pathParts[2] === "restart") {
      return await handleRestartSystem(req);
    }
  }

  return null;
}

// 请求处理器
const handler = async (req: Request): Promise<Response> => {
  try {
    // 处理 CORS 预检请求
    if (req.method === "OPTIONS") {
      return handleOptions();
    }

    const url = new URL(req.url);
    const normalizedPath = url.pathname.replace(/^\/+|\/+$/g, "");

    // 简单访问日志，便于排查前端是否真正调用到后端
    console.log(`[HTTP] ${req.method} ${normalizedPath}`);

    // 先尝试 REST API 路由
    const restResponse = await handleRestApi(req, normalizedPath);
    if (restResponse) {
      // 添加 CORS 头
      const headers = new Headers(restResponse.headers);
      Object.entries(corsHeaders).forEach(([key, value]) => {
        headers.set(key, value);
      });
      return new Response(restResponse.body, {
        status: restResponse.status,
        headers,
      });
    }

    // 处理 JSON-RPC 接口（保留向后兼容）
    if (normalizedPath === "api/workflow") {
      // 验证 Authorization 请求头（JSON-RPC 使用 API_KEY）
    const configManager = ConfigManager.getInstance();
    const API_KEY = await configManager.get("SERVER_API_KEY");

    const authHeader = req.headers.get("Authorization");
      if (!authHeader || !authHeader.startsWith("Bearer ") || authHeader.split(" ")[1] !== API_KEY) {
      return new Response(
        JSON.stringify({
          jsonrpc: "2.0",
          error: {
            code: -32001,
            message: "未授权的访问",
            data: {
              error: "缺少有效的 Authorization 请求头"
            }
          },
        }),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json",
              ...corsHeaders,
          }
        }
      );
    }

      const rpcResponse = await rpcServer.handleRequest(req);
      // 添加 CORS 头
      const headers = new Headers(rpcResponse.headers);
      Object.entries(corsHeaders).forEach(([key, value]) => {
        headers.set(key, value);
      });
      return new Response(rpcResponse.body, {
        status: rpcResponse.status,
        headers,
      });
    }

    // 404 未找到
    return new Response(
      JSON.stringify({
        code: 404,
        message: "接口不存在",
            path: normalizedPath,
      }),
      {
        status: 404,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        }
      }
    );
  } catch (error) {
    console.error("请求处理错误:", error);
    return new Response(
      JSON.stringify({
        code: 500,
          message: "服务器内部错误",
            error: error instanceof Error ? error.message : String(error)
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        }
      }
    );
  }
};

export default async function startServer(port = 8500) {
  // 初始化工作流服务（从数据库加载运行中的工作流）
  try {
    await initializeWorkflows();
  } catch (error) {
    console.error("初始化工作流失败:", error);
  }

  Deno.serve({ port }, handler);
  console.log(`服务器运行在 http://localhost:${port}`);
  console.log("\n支持的接口:");
  console.log("REST API:");
  console.log("  POST   /api/auth/login          - 用户登录");
  console.log("  GET    /api/auth/user           - 获取用户信息");
  console.log("  POST   /api/auth/logout        - 用户登出");
  console.log("  GET    /api/workflows          - 获取工作流列表");
  console.log("  POST   /api/workflows          - 创建工作流");
  console.log("  GET    /api/workflows/:id      - 获取工作流详情");
  console.log("  PUT    /api/workflows/:id      - 更新工作流");
  console.log("  DELETE /api/workflows/:id      - 删除工作流");
  console.log("  POST   /api/workflows/:id/start   - 启动工作流");
  console.log("  POST   /api/workflows/:id/stop    - 停止工作流");
  console.log("  POST   /api/workflows/:id/execute - 立即执行工作流");
  console.log("  GET    /api/config               - 获取系统配置");
  console.log("  PUT    /api/config               - 更新系统配置");
  console.log("  GET    /api/system/status        - 获取系统运行状态");
  console.log("  POST   /api/system/refresh       - 刷新系统状态");
  console.log("  POST   /api/system/restart       - 重启系统");
  console.log("\nJSON-RPC API (向后兼容):");
  console.log("  POST   /api/workflow           - 触发工作流");
  console.log(`  可用的工作流类型: ${Object.values(WorkflowType).join(", ")}`);
}
