// JWT Token 生成和验证工具
// 使用 Web Crypto API（Deno 内置支持）
// 注意：JWT_SECRET 需要与主项目保持一致，以便SSO登录

// 统一使用主系统的JWT_SECRET（与主系统保持一致）
const JWT_SECRET = Deno.env.get("JWT_SECRET");
if (!JWT_SECRET) {
  throw new Error("环境变量 JWT_SECRET 未配置");
}
const JWT_EXPIRES_IN = 7 * 24 * 60 * 60 * 1000; // 7天

export interface JWTPayload {
  userId: number;
  username: string;
  role: string;
  iat?: number;
  exp?: number;
}

// Base64 URL 编码 - 支持 Unicode 字符（中文等）
function base64UrlEncode(str: string): string {
  // 先将字符串编码为 UTF-8 字节，然后转换为 Base64
  const utf8Bytes = new TextEncoder().encode(str);
  return base64UrlEncodeBytes(utf8Bytes);
}

// Base64 URL 编码 - 直接编码字节数组（用于签名等二进制数据）
function base64UrlEncodeBytes(bytes: Uint8Array): string {
  // 将字节数组转换为二进制字符串，然后使用 btoa
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

// Base64 URL 解码 - 支持 Unicode 字符（中文等）
function base64UrlDecode(str: string): string {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) {
    str += "=";
  }
  const binary = atob(str);
  // 将二进制字符串转换为字节数组
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  // 使用 TextDecoder 将 UTF-8 字节解码为字符串
  return new TextDecoder().decode(bytes);
}

// 生成 JWT Token
export async function generateToken(payload: Omit<JWTPayload, "iat" | "exp">): Promise<string> {
  const header = {
    alg: "HS256",
    typ: "JWT",
  };

  const now = Date.now();
  const jwtPayload: JWTPayload = {
    ...payload,
    iat: Math.floor(now / 1000),
    exp: Math.floor((now + JWT_EXPIRES_IN) / 1000),
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(jwtPayload));

  const signatureInput = `${encodedHeader}.${encodedPayload}`;

  // 使用 Web Crypto API 生成签名
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(JWT_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(signatureInput)
  );

  const encodedSignature = base64UrlEncodeBytes(new Uint8Array(signature));

  return `${encodedHeader}.${encodedPayload}.${encodedSignature}`;
}

// 验证 JWT Token
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) {
      return null;
    }

    const [encodedHeader, encodedPayload, encodedSignature] = parts;

    // 验证签名
    const signatureInput = `${encodedHeader}.${encodedPayload}`;
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(JWT_SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    const signature = Uint8Array.from(
      atob(encodedSignature.replace(/-/g, "+").replace(/_/g, "/"))
        .split("")
        .map((c) => c.charCodeAt(0))
    );

    const isValid = await crypto.subtle.verify(
      "HMAC",
      key,
      signature,
      new TextEncoder().encode(signatureInput)
    );

    if (!isValid) {
      return null;
    }

    // 解析 payload
    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as JWTPayload;

    // 检查过期时间
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch (error) {
    console.error("Token verification error:", error);
    return null;
  }
}

// 从请求头提取 Token
export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.substring(7);
}

// 验证主系统的JWT Token（用于SSO）
// 注意：现在统一使用JWT_SECRET，所以直接调用verifyToken即可
export async function verifyMainSystemToken(token: string): Promise<JWTPayload | null> {
  // 统一使用主系统的JWT_SECRET，所以直接验证即可
  return await verifyToken(token);
}

