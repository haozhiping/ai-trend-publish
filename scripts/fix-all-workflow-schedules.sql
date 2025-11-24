-- 修复所有工作流的 Cron 表达式格式错误
-- node-cron 只支持 5 位标准格式: 分 时 日 月 周

-- 查看当前所有工作流的 schedule
SELECT id, name, schedule, status FROM workflows ORDER BY id;

-- 修复工作流 3（如果还是 6 位格式）
UPDATE workflows SET schedule = '0 3 * * *' WHERE id = 3 AND schedule = '0 0 3 * * *';

-- 修复工作流 4（小时字段 39 无效，应该是 0-23）
-- 假设原意是每天 14:00（下午2点），39 可能是误输入
UPDATE workflows SET schedule = '0 14 * * *' WHERE id = 4;

-- 或者如果不确定原意，可以删除错误的 schedule（改为手动执行）
-- UPDATE workflows SET schedule = NULL WHERE id = 4;

-- 验证修复结果
SELECT id, name, schedule, status FROM workflows ORDER BY id;

-- 说明：
-- 工作流 4 的原 schedule 是 '0 14 39 * * *'
-- 这是一个 6 位格式被错误当成 5 位格式使用的情况
-- 正确的 5 位格式应该是：分 时 日 月 周
-- 例如：
--   每天 14:00  -> 0 14 * * *
--   每天 03:00  -> 0 3 * * *
--   每周一 03:00 -> 0 3 * * 1

