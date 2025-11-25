import { ConfigManager } from "@src/utils/config/config-manager.ts";
import db from "@src/db/db.ts";
import { dataSources } from "@src/db/schema.ts";
import { eq } from "drizzle-orm";
import { Logger } from "@zilla/logger";
export type NewsPlatform = "firecrawl" | "twitter";

const logger = new Logger("getDataSources");

interface SourceItem {
  identifier: string;
}

type SourceConfig = Record<NewsPlatform, SourceItem[]>;

// 本地源配置
export const sourceConfigs: SourceConfig = {
  firecrawl: [
    { identifier: "https://news.ycombinator.com/" },
  ],
  twitter: [
    { identifier: "https://x.com/OpenAIDevs" },
  ],
} as const;

interface DbSource {
  identifier: string;
  platform: NewsPlatform;
}

export const getDataSources = async (): Promise<SourceConfig> => {
  const configManager = ConfigManager.getInstance();
  try {
    const dbEnabled = await configManager.get("ENABLE_DB");
    const mergedSources: SourceConfig = JSON.parse(
      JSON.stringify(sourceConfigs),
    );

    if (dbEnabled) {
      logger.info("开始从数据库获取数据源");
      const dbResults = await db.select({
        identifier: dataSources.identifier,
        platform: dataSources.platform,
        enabled: dataSources.enabled,
        url: dataSources.url,
      })
        .from(dataSources)
        .where(eq(dataSources.enabled, 1));

      // 处理数据库结果 - 只处理启用的数据源
      dbResults.forEach((item) => {
        const { platform, identifier, url } = item;
        // 优先使用 url，如果没有则使用 identifier
        const sourceId = url || identifier;
        if (
          sourceId !== null &&
          platform !== null &&
          platform in mergedSources
        ) {
          const exists = mergedSources[platform as NewsPlatform].some(
            (source) => source.identifier === sourceId,
          );
          if (!exists) {
            mergedSources[platform as NewsPlatform].push({ identifier: sourceId });
          }
        }
      });
    }

    return mergedSources;
  } catch (error) {
    console.error("Failed to get data sources from database:", error);
    // 数据库不可用时返回本地配置
    return sourceConfigs;
  }
};
