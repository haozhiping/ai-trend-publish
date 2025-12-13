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

// 从主系统同步用户（SSO登录时使用）
export async function syncUserFromMainSystem(mainSystemPayload: {
  userId: number;
  username: string;
  role: string;
}): Promise<UserInfo> {
  try {
    // 检查用户是否已存在
    const existingUsers = await db
      .select()
      .from(users)
      .where(eq(users.username, mainSystemPayload.username))
      .limit(1);

    if (existingUsers.length > 0) {
      // 用户已存在，更新最后登录时间
      const user = existingUsers[0];
      await db
        .update(users)
        .set({ lastLoginAt: new Date() })
        .where(eq(users.id, user.id));

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
    }

    // 用户不存在，创建新用户（使用主系统的用户信息）
    // 注意：这里不设置密码，因为用户只能通过主系统登录
    const newUserResult = await db
      .insert(users)
      .values({
        username: mainSystemPayload.username,
        password: "", // 空密码，只能通过SSO登录
        email: null,
        name: mainSystemPayload.username,
        role: mainSystemPayload.role || "user",
        status: 1,
        lastLoginAt: new Date(),
      });

    // 获取新创建的用户ID（Deno MySQL2返回的是ResultSetHeader）
    const newUserId = (newUserResult as any).insertId || (newUserResult as any)[0]?.insertId;
    
    if (!newUserId) {
      throw new Error("创建用户失败：无法获取新用户ID");
    }

    // 获取新创建的用户
    const createdUsers = await db
      .select()
      .from(users)
      .where(eq(users.id, newUserId))
      .limit(1);

    if (createdUsers.length === 0) {
      throw new Error("创建用户失败");
    }

    const user = createdUsers[0];

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      role: user.role,
      permissions: [],
    };
  } catch (error) {
    logger.error("Sync user from main system error:", error);
    throw error;
  }
}

