-- Rename the legacy control-tower demo agent and replace old "decision sheet"
-- wording in its user-facing copy.
UPDATE agent
SET
  name = '异常处理Agent',
  description = REPLACE(description, '决策单', '任务'),
  instructions = REPLACE(
    REPLACE(
      REPLACE(instructions, '供应链控制塔 Agent', '供应链异常处理Agent'),
      '控制塔 Agent',
      '异常处理Agent'
    ),
    '决策单',
    '任务'
  )
WHERE
  name = '控制塔 Agent'
  OR description LIKE '%决策单%'
  OR instructions LIKE '%决策单%'
  OR instructions LIKE '%控制塔 Agent%';
