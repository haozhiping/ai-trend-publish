import { extractTokenFromHeader, verifyToken } from "@src/utils/auth/jwt.ts";
import { formatBeijingDateTime } from "@src/utils/time.util.ts";
import { join } from "jsr:@std/path";

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

async function verifyAuth(request: Request): Promise<{ userId?: number } | null> {
  const authHeader = request.headers.get("Authorization");
  const token = extractTokenFromHeader(authHeader);
  if (!token) return null;

  const payload = await verifyToken(token);
  return payload ? { userId: payload.userId } : null;
}

export async function handleGetVideos(request: Request): Promise<Response> {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return new Response(JSON.stringify(errorResponse("未授权", 401)), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const url = new URL(request.url);
    const outputPath = url.searchParams.get("outputPath") || 
      "D:\\code\\weixin\\ai-trend-publish_web\\src\\video";

    // 读取视频目录
    const videos: any[] = [];
    try {
      const entries = Deno.readDir(outputPath);
      for await (const entry of entries) {
        if (entry.isFile && /\.(mp4|mov|avi)$/i.test(entry.name)) {
          const filePath = join(outputPath, entry.name);
          const fileStat = await Deno.stat(filePath);
          
          videos.push({
            id: videos.length + 1,
            title: entry.name.replace(/\.(mp4|mov|avi)$/i, ""),
            filePath,
            fileSize: fileStat.size,
            status: "completed",
            createdAt: fileStat.mtime?.toISOString() || new Date().toISOString(),
          });
        }
      }
    } catch (error) {
      // 目录不存在或无法读取
      console.warn("无法读取视频目录:", error);
    }

    // 按创建时间倒序
    videos.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return new Response(JSON.stringify(successResponse(videos)), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "获取视频列表失败";
    return new Response(JSON.stringify(errorResponse(message, 500)), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function handleGetVideoStream(
  request: Request,
  id: string,
): Promise<Response> {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return new Response(JSON.stringify(errorResponse("未授权", 401)), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // TODO: 实现视频流传输
    return new Response("视频流功能待实现", {
      status: 501,
      headers: { "Content-Type": "text/plain" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "获取视频流失败";
    return new Response(JSON.stringify(errorResponse(message, 500)), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function handleDownloadVideo(
  request: Request,
  id: string,
): Promise<Response> {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return new Response(JSON.stringify(errorResponse("未授权", 401)), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // TODO: 实现视频下载
    return new Response("视频下载功能待实现", {
      status: 501,
      headers: { "Content-Type": "text/plain" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "下载视频失败";
    return new Response(JSON.stringify(errorResponse(message, 500)), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function handleDeleteVideo(
  request: Request,
  id: string,
): Promise<Response> {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return new Response(JSON.stringify(errorResponse("未授权", 401)), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // TODO: 实现视频删除
    return new Response(JSON.stringify(successResponse(null, "视频已删除")), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "删除视频失败";
    return new Response(JSON.stringify(errorResponse(message, 500)), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

