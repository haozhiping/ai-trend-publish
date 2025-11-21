// 生成 bcrypt 密码哈希的脚本
import bcrypt from "npm:bcryptjs@^2.4.3";

const password = "admin123";
const hash = await bcrypt.hash(password, 10);
console.log(`密码: ${password}`);
console.log(`哈希值: ${hash}`);
console.log("\nSQL 语句:");
console.log(`INSERT INTO \`users\` (\`username\`, \`password\`, \`email\`, \`name\`, \`role\`, \`permissions\`, \`status\`) VALUES`);
console.log(`('admin', '${hash}', 'admin@example.com', '系统管理员', 'admin', '["*"]', 1)`);

