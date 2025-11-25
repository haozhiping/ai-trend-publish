/**
 * 授权码管理控制器
 */

import { ensureAuthenticated } from "@src/controllers/helpers/auth.ts";
import { jsonResponse } from "@src/controllers/helpers/response.ts";
import { generateLicenseByType, validateLicense, type LicenseType } from "@src/utils/license/license-generator.ts";
import db from "@src/db/db.ts";
import { licenses } from "@src/db/schema.ts";
import { eq } from "drizzle-orm";
import { getBeijingNow } from "@src/utils/time.util.ts";

/**
 * 生成授权码（管理员）
 */
export async function handleGenerateLicense(req: Request): Promise<Response> {
  const auth = await ensureAuthenticated(req);
  if (auth.response) return auth.response;

  const body = await req.json();
  const { type, count = 1 } = body;

  if (!type || !["DAY", "WEEK", "MONTH", "QUARTER", "HALF_YEAR", "YEAR", "PERMANENT"].includes(type)) {
    return jsonResponse({ code: 400, message: "无效的授权类型" });
  }

  const generatedLicenses = [];
  for (let i = 0; i < count; i++) {
    const licenseCode = generateLicenseByType(type as LicenseType);
    
    // 保存到数据库
    const [license] = await db.insert(licenses).values({
      licenseCode,
      type: type as LicenseType,
      status: "active",
      createdAt: getBeijingNow(),
      createdBy: auth.user?.id || 0,
    }).returning();

    generatedLicenses.push(license);
  }

  return jsonResponse({
    code: 200,
    message: `成功生成 ${count} 个授权码`,
    data: generatedLicenses,
  });
}

/**
 * 验证授权码
 */
export async function handleValidateLicense(req: Request): Promise<Response> {
  const body = await req.json();
  const { licenseCode } = body;

  if (!licenseCode) {
    return jsonResponse({ code: 400, message: "请提供授权码" });
  }

  const licenseInfo = await validateLicense(licenseCode);

  return jsonResponse({
    code: 200,
    message: licenseInfo.isValid ? "授权码有效" : "授权码无效或已过期",
    data: licenseInfo,
  });
}

/**
 * 获取授权码列表（管理员）
 */
export async function handleListLicenses(req: Request): Promise<Response> {
  const auth = await ensureAuthenticated(req);
  if (auth.response) return auth.response;

  const url = new URL(req.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const pageSize = parseInt(url.searchParams.get("pageSize") || "20");
  const status = url.searchParams.get("status");

  let query = db.select().from(licenses);

  if (status) {
    query = query.where(eq(licenses.status, status));
  }

  const allLicenses = await query;
  const total = allLicenses.length;
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const paginatedLicenses = allLicenses.slice(start, end);

  return jsonResponse({
    code: 200,
    message: "获取授权码列表成功",
    data: {
      list: paginatedLicenses,
      total,
      page,
      pageSize,
    },
  });
}

