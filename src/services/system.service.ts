import { Logger } from "@zilla/logger";

const logger = new Logger("SystemService");

interface SystemStatus {
  uptime: string;
  version: string;
  lastUpdate: string;
  status: "running" | "maintenance" | "restarting";
}

let systemStatus: SystemStatus = {
  uptime: "2天14小时32分",
  version: "v1.2.3",
  lastUpdate: new Date().toISOString(),
  status: "running",
};

export function getSystemStatus(): SystemStatus {
  return { ...systemStatus };
}

export function refreshSystemStatus(): SystemStatus {
  systemStatus = {
    ...systemStatus,
    lastUpdate: new Date().toISOString(),
    status: systemStatus.status === "running" ? "running" : "maintenance",
  };
  logger.info("系统状态刷新");
  return getSystemStatus();
}

export function requestSystemRestart(): { message: string; status: SystemStatus } {
  systemStatus = {
    ...systemStatus,
    uptime: "0天0小时0分钟",
    lastUpdate: new Date().toISOString(),
    status: "restarting",
  };
  logger.info("收到重启请求，正在执行重启...");
  
  // 延迟 1 秒后真正退出进程，让响应先返回给前端
  setTimeout(() => {
    logger.info("执行系统重启：退出进程 (exit code 0)");
    Deno.exit(0);
  }, 1000);
  
  return {
    message: "后端将在 1 秒后重启，请确保使用 deno task start 或守护进程自动拉起",
    status: getSystemStatus(),
  };
}

