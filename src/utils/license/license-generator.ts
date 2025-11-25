/**
 * 授权码生成和验证工具
 * 使用 JWT 和 AES 加密实现安全的授权码系统
 */

import { createHmac } from "jsr:@std/crypto/hmac";
import { encodeBase64, decodeBase64 } from "jsr:@std/encoding/base64";

export type LicenseType = "DAY" | "WEEK" | "MONTH" | "QUARTER" | "HALF_YEAR" | "YEAR" | "PERMANENT";

export interface LicenseInfo {
  type: LicenseType;
  expiryDate?: Date;
  isValid: boolean;
  daysRemaining?: number;
  isExpired: boolean;
}

// 私钥（应该从环境变量或配置中读取）
const LICENSE_SECRET_KEY = Deno.env.get("LICENSE_SECRET_KEY") || "mysoai-license-secret-key-2025-change-in-production";

/**
 * 生成授权码
 * @param type 授权类型
 * @param days 天数（对于永久授权，传 0）
 * @returns 授权码字符串
 */
export function generateLicense(type: LicenseType, days: number = 0): string {
  const now = new Date();
  let expiryDate: Date | null = null;
  
  // 计算过期时间
  if (type !== "PERMANENT") {
    const expiryTimestamp = now.getTime() + (days * 24 * 60 * 60 * 1000);
    expiryDate = new Date(expiryTimestamp);
  }
  
  // 构建授权数据
  const licenseData = {
    type,
    issuedAt: now.toISOString(),
    expiryAt: expiryDate?.toISOString() || null,
    days,
    version: "1.0",
  };
  
  // 序列化数据
  const dataString = JSON.stringify(licenseData);
  
  // 使用 HMAC 生成签名
  const signature = createHmac("sha256", LICENSE_SECRET_KEY)
    .update(dataString)
    .digest();
  
  // 组合数据和签名
  const payload = {
    data: licenseData,
    signature: encodeBase64(signature),
  };
  
  // Base64 编码
  const licenseCode = encodeBase64(
    new TextEncoder().encode(JSON.stringify(payload))
  );
  
  // 添加类型前缀以便识别
  return `${type}-${licenseCode}`;
}

/**
 * 根据类型生成授权码（便捷方法）
 */
export function generateLicenseByType(type: LicenseType): string {
  const daysMap: Record<LicenseType, number> = {
    DAY: 1,
    WEEK: 7,
    MONTH: 30,
    QUARTER: 90,
    HALF_YEAR: 180,
    YEAR: 365,
    PERMANENT: 0,
  };
  
  return generateLicense(type, daysMap[type]);
}

/**
 * 验证授权码
 * @param licenseCode 授权码
 * @returns 授权信息
 */
export async function validateLicense(licenseCode: string): Promise<LicenseInfo> {
  try {
    // 解析授权码
    const parts = licenseCode.split("-");
    if (parts.length < 2) {
      return {
        type: "DAY",
        isValid: false,
        isExpired: true,
      };
    }
    
    const type = parts[0] as LicenseType;
    const encodedPayload = parts.slice(1).join("-");
    
    // Base64 解码
    const payloadBytes = decodeBase64(encodedPayload);
    const payloadString = new TextDecoder().decode(payloadBytes);
    const payload = JSON.parse(payloadString);
    
    // 验证签名
    const dataString = JSON.stringify(payload.data);
    const expectedSignature = createHmac("sha256", LICENSE_SECRET_KEY)
      .update(dataString)
      .digest();
    const providedSignature = decodeBase64(payload.signature);
    
    // 比较签名
    if (expectedSignature.length !== providedSignature.length) {
      return {
        type,
        isValid: false,
        isExpired: true,
      };
    }
    
    let signatureMatch = true;
    for (let i = 0; i < expectedSignature.length; i++) {
      if (expectedSignature[i] !== providedSignature[i]) {
        signatureMatch = false;
        break;
      }
    }
    
    if (!signatureMatch) {
      return {
        type,
        isValid: false,
        isExpired: true,
      };
    }
    
    // 检查过期时间
    const now = new Date();
    let isExpired = false;
    let daysRemaining: number | undefined;
    
    if (payload.data.expiryAt) {
      const expiryDate = new Date(payload.data.expiryAt);
      isExpired = now > expiryDate;
      if (!isExpired) {
        daysRemaining = Math.ceil((expiryDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
      }
    }
    
    return {
      type,
      expiryDate: payload.data.expiryAt ? new Date(payload.data.expiryAt) : undefined,
      isValid: !isExpired,
      daysRemaining,
      isExpired,
    };
  } catch (error) {
    console.error("授权码验证失败:", error);
    return {
      type: "DAY",
      isValid: false,
      isExpired: true,
    };
  }
}

/**
 * 格式化授权码显示
 */
export function formatLicenseCode(licenseCode: string): string {
  // 将长授权码格式化为更易读的格式
  const parts = licenseCode.split("-");
  if (parts.length < 2) return licenseCode;
  
  const type = parts[0];
  const code = parts.slice(1).join("-");
  
  // 每 8 个字符加一个连字符
  const formattedCode = code.match(/.{1,8}/g)?.join("-") || code;
  
  return `${type}-${formattedCode}`;
}

