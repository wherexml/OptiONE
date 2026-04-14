-- Restore the legacy control-tower demo agent copy.
UPDATE agent
SET
  name = '控制塔 Agent',
  description = REPLACE(description, '任务', '决策单'),
  instructions = REPLACE(
    REPLACE(
      REPLACE(instructions, '供应链异常处理Agent', '供应链控制塔 Agent'),
      '异常处理Agent',
      '控制塔 Agent'
    ),
    '任务',
    '决策单'
  )
WHERE
  name = '异常处理Agent'
  OR description LIKE '%初始任务%'
  OR instructions LIKE '%初始任务%'
  OR instructions LIKE '%异常处理Agent%';
