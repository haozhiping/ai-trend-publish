-- 修复工作流的 Cron 表达式格式
-- node-cron 只支持 5 位标准格式: 分 时 日 月 周
-- 不支持 6 位秒级格式

-- 查看当前的 schedule
SELECT id, name, schedule, status FROM workflows;

-- 修复工作流 3 的错误格式
-- 错误: 0 0 3 * * * (6位，秒级)
-- 正确: 0 3 * * * (5位，每天凌晨3点)
UPDATE workflows SET schedule = '0 3 * * *' WHERE id = 3;

-- 验证修复结果
SELECT id, name, schedule, status FROM workflows;

