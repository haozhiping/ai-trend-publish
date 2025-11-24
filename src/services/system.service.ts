import { Logger } from "@zilla/logger";

const logger = new Logger("SystemService");

interface SystemStatus {
  uptime: string;
  version: string;
  lastUpdate: string;
  status: "running" | "maintenance" | "restarting";
}

const serverStartTime = new Date();
const defaultVersion = Deno.env.get("APP_VERSION") ?? "v1.2.3";

function formatUptime(from: Date): string {
  const diffMs = Date.now() - from.getTime();
  const totalMinutes = Math.floor(diffMs / (1000 * 60));
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;
  return `${days}天${hours}小时${minutes}分钟`;
}

function formatBeijingTime(date = new Date()): string {
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date);
}

let systemStatus: SystemStatus = {
  uptime: "0天0小时0分钟",
  version: defaultVersion,
  lastUpdate: formatBeijingTime(),
  status: "running",
};

export function getSystemStatus(): SystemStatus {
  return {
    ...systemStatus,
    uptime: formatUptime(serverStartTime),
  };
}

export function refreshSystemStatus(): SystemStatus {
  systemStatus = {
    ...systemStatus,
    lastUpdate: formatBeijingTime(),
    status: systemStatus.status === "running" ? "running" : "maintenance",
  };
  logger.info("系统状态刷新");
  return getSystemStatus();
}

export function requestSystemRestart(): { message: string; status: SystemStatus } {
  systemStatus = {
    ...systemStatus,
    lastUpdate: formatBeijingTime(),
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

