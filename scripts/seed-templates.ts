import db from "../src/db/db.ts";
import { templates, dataSources } from "../src/db/schema.ts";
import { eq } from "drizzle-orm";

const templateSeeds = [
  {
    name: "灵积·百炼行业观察模板",
    description:
      "参考阿里云百炼 DashScope 行业快讯，适合产品更新、生态公告类长图文。",
    platform: "weixin",
    style: "dashscope",
    type: "article",
    previewUrl:
      "https://img.alicdn.com/imgextra/i4/O1CN01k6O1pt1MUBwpl5a7V_!!6000000001437-0-tps-1920-960.jpg",
    content:
      `<section class="hero" style="padding:40px;background:#f7fbff;border-radius:18px;margin-bottom:24px;">
  <p style="color:#1677ff;font-weight:600;">DashScope · 灵积智算</p>
  <h1 style="margin:12px 0 8px;font-size:28px;">{{title}}</h1>
  <p style="color:#4b5563;">聚焦大模型技术动态 / 生态合作 / 平台上线记录</p>
</section>
<article style="line-height:1.7;color:#111827;font-size:16px;">
  <p>原文参考：https://mp.weixin.qq.com/s/tA08_pzYal2_1S5HV9wQEQ</p>
  <p>建议结构：导语 → 三个亮点 → 产品动向 → 行动召唤。</p>
</article>`,
  },
  {
    name: "OpenAI DX 更新模板",
    description:
      "参考 OpenAI 生态资讯，突出产品截图和功能要点，适合英文资讯翻译稿。",
    platform: "weixin",
    style: "openai-weekly",
    type: "article",
    previewUrl:
      "https://img.alicdn.com/imgextra/i3/O1CN01DvYbmh1hS7IRsEh4N_!!6000000004302-0-tps-1920-960.jpg",
    content:
      `<section style="background:#0f172a;color:#fff;padding:36px;border-radius:18px;margin-bottom:20px;">
  <p style="letter-spacing:2px;text-transform:uppercase;font-size:12px;">OpenAI Dev Report</p>
  <h1 style="margin:12px 0;font-size:30px;">{{title}}</h1>
  <p style="color:#94a3b8;">来源：https://mp.weixin.qq.com/s/PbC5YIH1Vev34W_AOKMfiw</p>
</section>
<ol style="line-height:1.7;color:#1e293b;">
  <li>功能更新：详细描述能力与截图。</li>
  <li>开发者反馈：引用典型问题与解决方案。</li>
  <li>接入指引：补充控制台/文档路径。</li>
</ol>`,
  },
  {
    name: "知行体 · 技术专栏模板",
    description:
      "参考知乎/知识派文章布局，适合方法论、AI 实践复盘类型稿件。",
    platform: "weixin",
    style: "zhihu-tech",
    type: "article",
    previewUrl:
      "https://img.alicdn.com/imgextra/i2/O1CN01vT0GfZ1rOEb4v3MUq_!!6000000005573-0-tps-1920-960.jpg",
    content:
      `<header style="border-left:4px solid #3b82f6;padding-left:16px;margin-bottom:18px;">
  <h1 style="margin-bottom:6px;font-size:26px;">{{title}}</h1>
  <p style="color:#6b7280;">原文参考：https://mp.weixin.qq.com/s/lu91hzwJcAv0lSl3DpKpYQ</p>
</header>
<article style="font-size:16px;line-height:1.8;color:#111827;">
  <p>结构建议：背景 → 问题 → 方法 → 结果 → 经验教训。</p>
  <blockquote style="background:#f3f4f6;padding:16px;border-radius:12px;">
    引用小结或关键公式，方便读者提炼重点。
  </blockquote>
</article>`,
  },
  {
    name: "快讯式多卡片模板",
    description:
      "参考 AI 速递/快讯样式，一屏多卡片，适合日更资讯。",
    platform: "weixin",
    style: "multi-card",
    type: "article",
    previewUrl:
      "https://img.alicdn.com/imgextra/i2/O1CN01gELPmx1Yz7zsqJ7Jm_!!6000000003241-0-tps-1920-960.jpg",
    content:
      `<section style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px;">
  <article style="padding:16px;border:1px solid #e5e7eb;border-radius:16px;">
    <p style="color:#94a3b8;">{{category}}</p>
    <h2 style="margin:8px 0 12px;font-size:18px;">{{item.title}}</h2>
    <p>{{item.summary}}</p>
    <a href="{{item.url}}" style="display:inline-flex;align-items:center;color:#2563eb;margin-top:12px;">阅读原文 →</a>
  </article>
</section>
<p style="margin-top:20px;color:#6b7280;font-size:14px;">案例参考：https://mp.weixin.qq.com/s/mp9fP8Xsds7m3aN95sSDAg</p>`,
  },
];

const dataSourceSeeds = [
  {
    name: "新浪科技滚动",
    type: "firecrawl",
    platform: "web",
    identifier: "sina-tech",
    url: "https://feed.mix.sina.com.cn/api/roll/get?pageid=207&lid=1792&num=50",
    description: "新浪科技频道滚动新闻，覆盖国内外 AI/芯片/互联网资讯。",
  },
  {
    name: "百度 AI 要闻",
    type: "firecrawl",
    platform: "web",
    identifier: "baidu-ai",
    url: "https://baijiahao.baidu.com/s?id=1738291350463188255",
    description: "百度百家号精选的 AI 要闻，可配合 FireCrawl 抓取正文。",
  },
  {
    name: "36氪快讯",
    type: "firecrawl",
    platform: "web",
    identifier: "36kr-flash",
    url: "https://www.36kr.com/newsflashes",
    description: "36氪快讯列表，适合补充国内创业&投融资风向。",
  },
  {
    name: "知乎·AI 热点",
    type: "firecrawl",
    platform: "web",
    identifier: "zhihu-ai",
    url: "https://www.zhihu.com/topic/19552832/hot",
    description: "知乎 AI 话题热榜，可抓取问答摘要用于素材库。",
  },
];

async function upsertTemplates() {
  for (const seed of templateSeeds) {
    const existing = await db.select()
      .from(templates)
      .where(eq(templates.name, seed.name))
      .limit(1);

    if (existing.length > 0) {
      await db.update(templates)
        .set({
          description: seed.description,
          style: seed.style,
          platform: seed.platform,
          type: seed.type,
          content: seed.content,
          previewUrl: seed.previewUrl,
          updatedAt: new Date(),
        })
        .where(eq(templates.id, existing[0].id));
      console.log(`更新模板: ${seed.name}`);
    } else {
      await db.insert(templates).values({
        name: seed.name,
        description: seed.description,
        platform: seed.platform,
        style: seed.style,
        type: seed.type,
        content: seed.content,
        previewUrl: seed.previewUrl,
        isActive: 1,
        isDefault: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log(`新增模板: ${seed.name}`);
    }
  }
}

async function upsertDataSources() {
  for (const seed of dataSourceSeeds) {
    const existing = await db.select()
      .from(dataSources)
      .where(eq(dataSources.name, seed.name))
      .limit(1);

    if (existing.length > 0) {
      await db.update(dataSources)
        .set({
          type: seed.type,
          platform: seed.platform,
          identifier: seed.identifier,
          url: seed.url,
          description: seed.description,
          updatedAt: new Date(),
        })
        .where(eq(dataSources.id, existing[0].id));
      console.log(`更新数据源: ${seed.name}`);
    } else {
      await db.insert(dataSources).values({
        name: seed.name,
        type: seed.type,
        platform: seed.platform,
        identifier: seed.identifier,
        url: seed.url,
        description: seed.description,
        enabled: 1,
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log(`新增数据源: ${seed.name}`);
    }
  }
}

if (import.meta.main) {
  await upsertTemplates();
  await upsertDataSources();
  console.log("模板和数据源同步完成。");
  Deno.exit(0);
}

