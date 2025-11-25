import { WorkflowEntrypoint, WorkflowEvent, WorkflowStep } from "@src/works/workflow.ts";
import { Logger } from "@zilla/logger";
import { ConfigManager } from "@src/utils/config/config-manager.ts";
import { getDataSources } from "@src/data-sources/getDataSources.ts";
import { WorkflowTerminateError } from "@src/works/workflow-error.ts";

const logger = new Logger("video-generate-workflow");

interface VideoGenerateWorkflowEnv {
  name: string;
}

interface VideoGenerateWorkflowParams {
  videoUrls?: string[];
  videoFiles?: string[];
  voiceModel?: string;
  script?: string;
  prompt?: string;
  outputPath?: string;
  dingtalkKeyword?: string; // 钉钉通知关键词
}

export class VideoGenerateWorkflow
  extends WorkflowEntrypoint<VideoGenerateWorkflowEnv, VideoGenerateWorkflowParams> {
  
  private detectedExePath: string = "";
  
  async run(event: WorkflowEvent, step: WorkflowStep): Promise<void> {
    const params = event.payload as VideoGenerateWorkflowParams;

    logger.info("[工作流开始] 开始执行短视频生成工作流");
    this.recordLog("info", this.env.id, "工作流开始执行", { eventId: event.id });

    // 1. 检查授权码（可选，不强制）
    await step.do("check-license", async () => {
      const configManager = ConfigManager.getInstance();
      const licenseKey = await configManager.get<string>("VIDEO_GENERATOR_LICENSE").catch(() => undefined);
      
      if (!licenseKey) {
        logger.warn("[授权验证] 未配置授权码，将使用试用模式");
        this.recordLog("warning", "授权验证", "未配置授权码，使用试用模式");
        return; // 不抛出错误，允许继续执行
      }
      
      // 验证授权码有效性
      try {
        const { validateLicense } = await import("@src/utils/license/license-generator.ts");
        const licenseInfo = await validateLicense(licenseKey);
        
        if (!licenseInfo.isValid || licenseInfo.isExpired) {
          logger.warn(`[授权验证] 授权码已过期或无效，剩余天数: ${licenseInfo.daysRemaining || 0}`);
          this.recordLog("warning", "授权验证", `授权码已过期，请访问 ai.mysoai.com 续费`);
          // 不阻止执行，但记录警告
        } else {
          logger.info(`[授权验证] 授权码验证通过，剩余天数: ${licenseInfo.daysRemaining || "永久"}`);
          this.recordLog("info", "授权验证", `授权码验证通过，剩余 ${licenseInfo.daysRemaining || "永久"} 天`);
        }
      } catch (error) {
        logger.warn("[授权验证] 授权码验证失败，使用试用模式:", error);
        this.recordLog("warning", "授权验证", "授权码验证失败，使用试用模式");
      }
    });

    // 2. 检查环境依赖
    await step.do("check-environment", async () => {
      const configManager = ConfigManager.getInstance();
      const exePathConfig = await configManager.get<string>("VIDEO_GENERATOR_EXE_PATH").catch(() => undefined);
      const pythonScriptConfig = await configManager.get<string>("VIDEO_GENERATOR_PYTHON_SCRIPT").catch(() => undefined);
      
      // 优先使用配置的路径，否则使用默认路径
      const exePath = exePathConfig || "D:\\code\\weixin\\ai-video\\video-generator.exe";
      const pythonScript = pythonScriptConfig || "D:\\code\\weixin\\ai-video\\video_generator.py";
      
      let foundPath = "";
      let usePython = false;
      
      // 检查 exe 是否存在
      try {
        const stat = await Deno.stat(exePath);
        if (stat.isFile) {
          foundPath = exePath;
          this.detectedExePath = exePath;
          logger.info(`[环境检查] 找到 exe 程序: ${exePath}`);
        }
      } catch {
        // exe 不存在，检查 Python 脚本
        try {
          const stat = await Deno.stat(pythonScript);
          if (stat.isFile) {
            foundPath = pythonScript;
            this.detectedExePath = "python";
            usePython = true;
            logger.info(`[环境检查] 找到 Python 脚本: ${pythonScript}`);
          }
        } catch {
          // 都不存在，记录警告但不阻止执行（允许用户手动处理）
          logger.warn(`[环境检查] 未找到视频生成程序，exe: ${exePath}, python: ${pythonScript}`);
          this.recordLog("warning", "环境检查", `未找到视频生成程序，请确保已安装 video-generator.exe 或 video_generator.py`);
          // 不抛出错误，允许继续执行（用户可能在其他地方处理）
          return;
        }
      }
      
      if (foundPath) {
        logger.info("[环境检查] 视频生成程序检查通过");
        this.recordLog("info", "环境检查", "视频生成程序检查通过");
      }
    });

    // 3. 准备素材
    await step.do("prepare-materials", async () => {
      const videoUrls = params.videoUrls || [];
      const videoFiles = params.videoFiles || [];
      
      // 如果没有提供素材，从数据源获取
      if (videoUrls.length === 0 && videoFiles.length === 0) {
        const sources = await getDataSources();
        const videoSources = sources.firecrawl?.filter(s => 
          s.identifier?.includes("douyin") || 
          s.identifier?.includes("抖音") ||
          s.identifier?.includes("video")
        ) || [];
        
        if (videoSources.length === 0) {
          throw new WorkflowTerminateError("未找到视频数据源，请在数据源管理中添加视频数据源");
        }
        
        // TODO: 从数据源获取视频链接
        logger.info(`[素材准备] 从数据源获取到 ${videoSources.length} 个视频源`);
        this.recordLog("info", "素材准备", `从数据源获取到 ${videoSources.length} 个视频源`);
      } else {
        logger.info(`[素材准备] 使用提供的素材: ${videoUrls.length} 个链接, ${videoFiles.length} 个文件`);
        this.recordLog("info", "素材准备", `使用提供的素材: ${videoUrls.length} 个链接, ${videoFiles.length} 个文件`);
      }
    });

    // 4. 生成脚本（如果没有提供）
    await step.do("generate-script", async () => {
      const script = params.script;
      
      if (!script) {
        // TODO: 使用 LLM 生成脚本
        logger.info("[脚本生成] 开始生成视频脚本");
        this.recordLog("info", "脚本生成", "开始生成视频脚本");
        
        const generatedScript = "AI生成的视频脚本内容...";
        logger.info("[脚本生成] 脚本生成完成");
        this.recordLog("info", "脚本生成", "脚本生成完成");
      } else {
        logger.info("[脚本生成] 使用提供的脚本");
        this.recordLog("info", "脚本生成", "使用提供的脚本");
      }
    });

    // 5. 调用 exe 生成视频
    await step.do("generate-video", async () => {
      // 如果环境检查时没有找到程序，这里直接返回
      if (!this.detectedExePath) {
        logger.warn("[视频生成] 视频生成程序未找到，跳过生成步骤");
        this.recordLog("warning", "视频生成", "视频生成程序未找到，请先安装 video-generator.exe 或 video_generator.py");
        return;
      }
      
      const configManager = ConfigManager.getInstance();
      const outputPath = params.outputPath || "D:\\code\\weixin\\ai-trend-publish_web\\src\\video";
      const voiceModel = params.voiceModel || "zh-CN-XiaoxiaoNeural";
      const pythonScriptConfig = await configManager.get<string>("VIDEO_GENERATOR_PYTHON_SCRIPT").catch(() => undefined);
      const pythonScript = pythonScriptConfig || "D:\\code\\weixin\\ai-video\\video_generator.py";
      
      // 确定执行命令
      let commandPath = this.detectedExePath;
      const commandArgs: string[] = [];
      
      if (this.detectedExePath === "python") {
        // 使用 Python 执行脚本
        commandArgs.push(pythonScript);
      }
      
      logger.info(`[视频生成] 开始调用视频生成程序: ${exePath}`);
      this.recordLog("info", "视频生成", `开始调用视频生成程序: ${exePath}`);
      
      // 构建命令行参数
      commandArgs.push(
        "--output", outputPath,
        "--voice", voiceModel,
      );
      
      // 添加视频文件或链接
      if (params.videoFiles && params.videoFiles.length > 0) {
        commandArgs.push("--video-files", ...params.videoFiles);
      } else if (params.videoUrls && params.videoUrls.length > 0) {
        commandArgs.push("--video-urls", ...params.videoUrls);
      }
      
      // 添加脚本或提示词
      if (params.script) {
        commandArgs.push("--script", params.script);
      } else if (params.prompt) {
        commandArgs.push("--prompt", params.prompt);
      }
      
      // 添加输出文件名
      const outputFilename = `generated_${Date.now()}.mp4`;
      commandArgs.push("--output-filename", outputFilename);
      
      // 添加授权码（如果有）
      const licenseKey = await configManager.get<string>("VIDEO_GENERATOR_LICENSE").catch(() => undefined);
      if (licenseKey) {
        commandArgs.push("--license", licenseKey);
      }
      
      try {
        // 调用 exe（或 Python 脚本）
        const command = new Deno.Command(commandPath, {
          args: commandArgs,
          stdout: "piped",
          stderr: "piped",
        });
        
        const { code, stdout, stderr } = await command.output();
        
        if (code !== 0) {
          const errorMsg = new TextDecoder().decode(stderr);
          throw new Error(`视频生成失败: ${errorMsg}`);
        }
        
        const output = new TextDecoder().decode(stdout);
        logger.info(`[视频生成] 视频生成成功: ${output}`);
        this.recordLog("info", "视频生成", `视频生成成功`);
        
        // 解析输出，获取生成的视频路径
        const videoPath = `${outputPath}\\generated_${Date.now()}.mp4`;
        
        this.recordContent({
          title: `生成的视频 - ${new Date().toLocaleString()}`,
          content: `视频已生成: ${videoPath}`,
          source: "video-generator",
          platform: "local",
          url: videoPath,
          status: "generated",
        });
        
        return { videoPath };
      } catch (error) {
        logger.error(`[视频生成] 视频生成失败:`, error);
        this.recordLog("error", "视频生成", `视频生成失败: ${error instanceof Error ? error.message : String(error)}`);
        throw error;
      }
    });

    logger.info("[工作流完成] 短视频生成工作流执行完成");
    this.recordLog("info", "工作流完成", "短视频生成工作流执行完成");
  }
}


