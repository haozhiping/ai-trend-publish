import db from "@src/db/db.ts";
import { workflows } from "@src/db/schema.ts";
import { eq, and, desc } from "drizzle-orm";
import { WorkflowType, getWorkflow } from "@src/controllers/cron.ts";
import { Logger } from "@zilla/logger";
import cron from "npm:node-cron";
import { persistWorkflowResult } from "@src/services/workflow-record.service.ts";
import {
  formatBeijingDateTime,
  getBeijingNow,
} from "@src/utils/time.util.ts";

const logger = new Logger("WorkflowService");

// 工作流状态管理
const workflowStatus = new Map<number, "running" | "stopped">();
const workflowSchedulers = new Map<number, cron.ScheduledTask>();

export interface WorkflowCreateRequest {
  name: string;
  type: string;
  description?: string;
  schedule?: string;
  config?: Record<string, any>;
}

export interface WorkflowUpdateRequest {
  name?: string;
  description?: string;
  schedule?: string;
  config?: Record<string, any>;
  status?: "running" | "stopped";
}

// 获取工作流列表
export async function getWorkflows() {
  const workflowList = await db.select().from(workflows);
  
  return workflowList.map(wf => ({
    id: wf.id,
    name: wf.name,
    type: wf.type,
    description: wf.description,
    status: workflowStatus.get(wf.id) || (wf.status as "running" | "stopped"),
    schedule: wf.schedule,
    config: wf.config,
    lastRun: formatBeijingDateTime(wf.lastRun),
    nextRun: formatBeijingDateTime(wf.nextRun),
    runCount: wf.runCount,
    successCount: wf.successCount,
    failCount: wf.failCount,
    createdAt: formatBeijingDateTime(wf.createdAt),
    updatedAt: formatBeijingDateTime(wf.updatedAt),
  }));
}

// 获取工作流详情
export async function getWorkflowById(id: number) {
  const workflowList = await db
    .select()
    .from(workflows)
    .where(eq(workflows.id, id))
    .limit(1);

  if (workflowList.length === 0) {
    throw new Error("工作流不存在");
  }

  const wf = workflowList[0];
  return {
    id: wf.id,
    name: wf.name,
    type: wf.type,
    description: wf.description,
    status: workflowStatus.get(wf.id) || (wf.status as "running" | "stopped"),
    schedule: wf.schedule,
    config: wf.config,
    lastRun: formatBeijingDateTime(wf.lastRun),
    nextRun: formatBeijingDateTime(wf.nextRun),
    runCount: wf.runCount,
    successCount: wf.successCount,
    failCount: wf.failCount,
    createdAt: formatBeijingDateTime(wf.createdAt),
    updatedAt: formatBeijingDateTime(wf.updatedAt),
  };
}

// 创建工作流
export async function createWorkflow(data: WorkflowCreateRequest, userId?: number) {
  // 验证工作流类型
  if (!Object.values(WorkflowType).includes(data.type as WorkflowType)) {
    throw new Error(`无效的工作流类型: ${data.type}`);
  }

  await db.insert(workflows).values({
    name: data.name,
    type: data.type,
    description: data.description || null,
    status: "stopped",
    schedule: data.schedule || null,
    config: data.config || null,
    createdBy: userId || null,
    createdAt: getBeijingNow(),
    updatedAt: getBeijingNow(),
  });

  const [latestWorkflow] = await db
    .select({ id: workflows.id })
    .from(workflows)
    .where(
      and(
        eq(workflows.name, data.name),
        eq(workflows.type, data.type)
      )
    )
    .orderBy(desc(workflows.id))
    .limit(1);

  if (!latestWorkflow) {
    throw new Error("创建工作流失败：无法获取自增ID");
  }
  const workflowId = latestWorkflow.id;
  logger.info(`工作流创建成功: ${workflowId}`);

  return await getWorkflowById(workflowId);
}

// 更新工作流
export async function updateWorkflow(id: number, data: WorkflowUpdateRequest) {
  const updateData: any = {
    updatedAt: getBeijingNow(),
  };
  
  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.schedule !== undefined) updateData.schedule = data.schedule;
  if (data.config !== undefined) updateData.config = data.config;
  if (data.status !== undefined) {
    updateData.status = data.status;
    // 更新内存中的状态
    workflowStatus.set(id, data.status);
    
    // 如果状态改变，需要启动或停止定时任务
    if (data.status === "running" && data.schedule) {
      await startWorkflowScheduler(id, data.schedule);
    } else {
      stopWorkflowScheduler(id);
    }
  }

  await db
    .update(workflows)
    .set(updateData)
    .where(eq(workflows.id, id));

  return await getWorkflowById(id);
}

// 删除工作流
export async function deleteWorkflow(id: number) {
  // 停止定时任务
  stopWorkflowScheduler(id);
  workflowStatus.delete(id);

  await db.delete(workflows).where(eq(workflows.id, id));
  logger.info(`工作流删除成功: ${id}`);
}

// 启动工作流
export async function startWorkflow(id: number) {
  const workflow = await getWorkflowById(id);
  
  if (workflow.status === "running") {
    throw new Error("工作流已在运行中");
  }

  // 如果有调度时间，启动定时任务
  if (workflow.schedule) {
    await startWorkflowScheduler(id, workflow.schedule);
  }

  await db
    .update(workflows)
    .set({ status: "running", updatedAt: getBeijingNow() })
    .where(eq(workflows.id, id));

  workflowStatus.set(id, "running");
  logger.info(`工作流启动成功: ${id}`);

  return await getWorkflowById(id);
}

// 停止工作流
export async function stopWorkflow(id: number) {
  stopWorkflowScheduler(id);
  
  await db
    .update(workflows)
    .set({ status: "stopped", updatedAt: getBeijingNow() })
    .where(eq(workflows.id, id));

  workflowStatus.set(id, "stopped");
  logger.info(`工作流停止成功: ${id}`);

  return await getWorkflowById(id);
}

// 立即执行工作流
export async function executeWorkflow(id: number) {
  const workflow = await getWorkflowById(id);
  
  // 验证工作流类型
  if (!Object.values(WorkflowType).includes(workflow.type as WorkflowType)) {
    throw new Error(`无效的工作流类型: ${workflow.type}`);
  }

  // 更新运行次数和最后运行时间
  await db
    .update(workflows)
    .set({
      lastRun: getBeijingNow(),
      runCount: (workflow.runCount || 0) + 1,
      updatedAt: getBeijingNow(),
    })
    .where(eq(workflows.id, id));

  // 执行工作流（异步，不等待完成）
  const workflowInstance = getWorkflow(workflow.type as WorkflowType);
  const execution = workflowInstance.execute({
    payload: workflow.config || {},
    id: `manual-${id}-${Date.now()}`,
    timestamp: Date.now(),
  });

  execution.then(async () => {
    await db.update(workflows)
      .set({
        successCount: (workflow.successCount || 0) + 1,
        updatedAt: getBeijingNow(),
      })
      .where(eq(workflows.id, id));

    await persistWorkflowResult(
      { id: workflow.id, type: workflow.type, name: workflow.name },
      workflowInstance.getLastRunResult(),
    );
    logger.info(`工作流执行成功: ${id}`);
  }).catch(async (error) => {
    await db.update(workflows)
      .set({
        failCount: (workflow.failCount || 0) + 1,
        updatedAt: getBeijingNow(),
      })
      .where(eq(workflows.id, id));

    await persistWorkflowResult(
      { id: workflow.id, type: workflow.type, name: workflow.name },
      workflowInstance.getLastRunResult(),
    );
    logger.error(`工作流执行失败: ${id}`, error);
  });

  return {
    message: "工作流已开始执行",
    workflowId: id,
  };
}

// 启动工作流定时任务
async function startWorkflowScheduler(id: number, schedule: string) {
  // 停止旧的定时任务
  stopWorkflowScheduler(id);

  // 验证 Cron 表达式格式
  if (!cron.validate(schedule)) {
    logger.error(`工作流 ${id} 的 Cron 表达式格式错误: ${schedule}`);
    logger.error(`node-cron 支持 5 位标准格式: 分 时 日 月 周 (例如: 0 3 * * *)`);
    throw new Error(`Invalid cron expression: ${schedule}`);
  }

  // 创建新的定时任务
  try {
    const task = cron.schedule(
      schedule,
      async () => {
        try {
          await executeWorkflow(id);
        } catch (error) {
          logger.error(`定时任务执行失败: ${id}`, error);
        }
      },
      {
        timezone: "Asia/Shanghai",
      }
    );

    workflowSchedulers.set(id, task);
    logger.info(`工作流定时任务启动: ${id}, schedule: ${schedule}`);
  } catch (error) {
    logger.error(`创建定时任务失败 (工作流 ${id}):`, error);
    throw error;
  }
}

// 停止工作流定时任务
function stopWorkflowScheduler(id: number) {
  const task = workflowSchedulers.get(id);
  if (task) {
    task.stop();
    workflowSchedulers.delete(id);
    logger.info(`工作流定时任务停止: ${id}`);
  }
}

// 初始化：从数据库加载工作流状态并启动定时任务
export async function initializeWorkflows() {
  const workflowList = await db
    .select()
    .from(workflows)
    .where(eq(workflows.status, "running"));

  for (const wf of workflowList) {
    workflowStatus.set(wf.id, "running");
    if (wf.schedule) {
      try {
        await startWorkflowScheduler(wf.id, wf.schedule);
      } catch (error) {
        logger.error(`工作流 ${wf.id} (${wf.name}) 启动失败:`, error);
        logger.error(`请检查 Cron 表达式格式: ${wf.schedule}`);
        // 继续初始化其他工作流，不要因为一个失败就终止整个启动
      }
    }
  }

  logger.info(`初始化工作流: ${workflowList.length} 个运行中的工作流`);
}

