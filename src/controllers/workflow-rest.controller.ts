import {
  getWorkflows,
  getWorkflowById,
  createWorkflow,
  updateWorkflow,
  deleteWorkflow,
  startWorkflow,
  stopWorkflow,
  executeWorkflow,
} from "@src/services/workflow.service.ts";
import { extractTokenFromHeader, verifyToken } from "@src/utils/auth/jwt.ts";
import cron from "npm:node-cron";
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

// 验证认证
async function verifyAuth(request: Request): Promise<{ userId?: number } | null> {
  const authHeader = request.headers.get("Authorization");
  const token = extractTokenFromHeader(authHeader);
  
  if (!token) {
    return null;
  }

  const payload = await verifyToken(token);
  return payload ? { userId: payload.userId } : null;
}

// 获取工作流列表
export async function handleGetWorkflows(request: Request): Promise<Response> {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return new Response(
        JSON.stringify(errorResponse("未授权", 401)),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const workflows = await getWorkflows();
    return new Response(
      JSON.stringify(successResponse(workflows)),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "获取工作流列表失败";
    return new Response(
      JSON.stringify(errorResponse(message, 500)),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

// 获取工作流详情
export async function handleGetWorkflow(request: Request, id: string): Promise<Response> {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return new Response(
        JSON.stringify(errorResponse("未授权", 401)),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const workflow = await getWorkflowById(Number(id));
    return new Response(
      JSON.stringify(successResponse(workflow)),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "获取工作流详情失败";
    const code = message.includes("不存在") ? 404 : 500;
    return new Response(
      JSON.stringify(errorResponse(message, code)),
      { status: code, headers: { "Content-Type": "application/json" } }
    );
  }
}

// 创建工作流
export async function handleCreateWorkflow(request: Request): Promise<Response> {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return new Response(
        JSON.stringify(errorResponse("未授权", 401)),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const body = await request.json();
    
    // 验证 Cron 表达式格式（如果提供了 schedule）
    if (body.schedule && body.schedule.trim() !== '') {
      if (!cron.validate(body.schedule)) {
        return new Response(
          JSON.stringify(errorResponse(
            `Cron 表达式格式错误: ${body.schedule}。node-cron 仅支持 5 位标准格式（分 时 日 月 周），例如：0 3 * * * 表示每天凌晨3点`,
            400
          )),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
    }
    
    const workflow = await createWorkflow(body, auth.userId);
    
    return new Response(
      JSON.stringify(successResponse(workflow, "工作流创建成功")),
      { status: 201, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "创建工作流失败";
    return new Response(
      JSON.stringify(errorResponse(message, 400)),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
}

// 更新工作流
export async function handleUpdateWorkflow(request: Request, id: string): Promise<Response> {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return new Response(
        JSON.stringify(errorResponse("未授权", 401)),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const body = await request.json();
    
    // 验证 Cron 表达式格式（如果提供了 schedule）
    if (body.schedule && body.schedule.trim() !== '') {
      if (!cron.validate(body.schedule)) {
        return new Response(
          JSON.stringify(errorResponse(
            `Cron 表达式格式错误: ${body.schedule}。node-cron 仅支持 5 位标准格式（分 时 日 月 周），例如：0 3 * * * 表示每天凌晨3点`,
            400
          )),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
    }
    
    const workflow = await updateWorkflow(Number(id), body);
    
    return new Response(
      JSON.stringify(successResponse(workflow, "工作流更新成功")),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "更新工作流失败";
    const code = message.includes("不存在") ? 404 : 400;
    return new Response(
      JSON.stringify(errorResponse(message, code)),
      { status: code, headers: { "Content-Type": "application/json" } }
    );
  }
}

// 删除工作流
export async function handleDeleteWorkflow(request: Request, id: string): Promise<Response> {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return new Response(
        JSON.stringify(errorResponse("未授权", 401)),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    await deleteWorkflow(Number(id));
    return new Response(
      JSON.stringify(successResponse(null, "工作流删除成功")),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "删除工作流失败";
    const code = message.includes("不存在") ? 404 : 500;
    return new Response(
      JSON.stringify(errorResponse(message, code)),
      { status: code, headers: { "Content-Type": "application/json" } }
    );
  }
}

// 启动工作流
export async function handleStartWorkflow(request: Request, id: string): Promise<Response> {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return new Response(
        JSON.stringify(errorResponse("未授权", 401)),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const workflow = await startWorkflow(Number(id));
    return new Response(
      JSON.stringify(successResponse(workflow, "工作流启动成功")),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "启动工作流失败";
    return new Response(
      JSON.stringify(errorResponse(message, 400)),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
}

// 停止工作流
export async function handleStopWorkflow(request: Request, id: string): Promise<Response> {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return new Response(
        JSON.stringify(errorResponse("未授权", 401)),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const workflow = await stopWorkflow(Number(id));
    return new Response(
      JSON.stringify(successResponse(workflow, "工作流停止成功")),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "停止工作流失败";
    return new Response(
      JSON.stringify(errorResponse(message, 400)),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
}

// 立即执行工作流
export async function handleExecuteWorkflow(request: Request, id: string): Promise<Response> {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return new Response(
        JSON.stringify(errorResponse("未授权", 401)),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const result = await executeWorkflow(Number(id));
    return new Response(
      JSON.stringify(successResponse(result, "工作流已开始执行")),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "执行工作流失败";
    return new Response(
      JSON.stringify(errorResponse(message, 400)),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
}

