import db from "@src/db/db.ts";
import { users } from "@src/db/schema.ts";
import { eq } from "drizzle-orm";
import { generateToken, verifyToken } from "@src/utils/auth/jwt.ts";
import { Logger } from "@zilla/logger";
import bcrypt from "npm:bcryptjs@^2.4.3";

const logger = new Logger("AuthService");

export interface LoginRequest {
  username: string;
  password: string;
  loginType?: "account" | "mobile";
}

export interface LoginResponse {
  token: string;
  user: {
    id: number;
    username: string;
    email: string | null;
    name: string | null;
    avatar: string | null;
    role: string;
    permissions: string[] | null;
  };
}

export interface UserInfo {
  id: number;
  username: string;
  email: string | null;
  name: string | null;
  avatar: string | null;
  role: string;
  permissions: string[] | null;
}

// 密码验证（使用 bcrypt）
async function verifyPassword(inputPassword: string, storedPassword: string): Promise<boolean> {
  try {
    // 使用 bcrypt 验证密码
    return await bcrypt.compare(inputPassword, storedPassword);
  } catch (error) {
    logger.error("密码验证错误:", error);
    return false;
  }
}

// 用户登录
export async function login(credentials: LoginRequest): Promise<LoginResponse> {
  try {
    const { username, password } = credentials;

    // 查询用户
    const userList = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    if (userList.length === 0) {
      throw new Error("用户名或密码错误");
    }

    const user = userList[0];

    // 检查用户状态
    if (user.status !== 1) {
      throw new Error("用户已被禁用");
    }

    // 验证密码
    const isValidPassword = await verifyPassword(password, user.password);
    if (!isValidPassword) {
      throw new Error("用户名或密码错误");
    }

    // 更新最后登录时间（使用 Date 对象，让驱动负责格式化）
    await db
      .update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.id, user.id));

    // 生成 Token
    const token = await generateToken({
      userId: user.id,
      username: user.username,
      role: user.role,
    });

    // 解析权限
    let permissions: string[] = [];
    if (user.permissions) {
      try {
        permissions = typeof user.permissions === "string"
          ? JSON.parse(user.permissions)
          : user.permissions;
      } catch (e) {
        permissions = [];
      }
    }

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        role: user.role,
        permissions,
      },
    };
  } catch (error) {
    logger.error("Login error:", error);
    throw error;
  }
}

// 获取用户信息
export async function getUserInfo(token: string): Promise<UserInfo | null> {
  try {
    const payload = await verifyToken(token);
    if (!payload) {
      return null;
    }

    const userList = await db
      .select()
      .from(users)
      .where(eq(users.id, payload.userId))
      .limit(1);

    if (userList.length === 0) {
      return null;
    }

    const user = userList[0];

    // 解析权限
    let permissions: string[] = [];
    if (user.permissions) {
      try {
        permissions = typeof user.permissions === "string"
          ? JSON.parse(user.permissions)
          : user.permissions;
      } catch (e) {
        permissions = [];
      }
    }

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      role: user.role,
      permissions,
    };
  } catch (error) {
    logger.error("Get user info error:", error);
    return null;
  }
}

// 验证 Token
export async function verifyAuthToken(token: string) {
  return await verifyToken(token);
}

