-- Demo seed data for the simplified supply-chain case set.
-- Goals:
-- 1. Clear all existing tasks under the demo project.
-- 2. Recreate a smaller, more focused task set aligned with the PRD scenarios.
-- 3. Keep task details business-readable and realistic for project center + my issues.

-- Remove the current demo project tasks first.
WITH cleanup AS (
    DELETE FROM issue
    WHERE project_id = '70000000-0000-0000-0000-000000000001'::uuid
    RETURNING id
)
SELECT COUNT(*) AS deleted_demo_issues
FROM cleanup;

-- Upsert demo project metadata.
WITH ws AS (
    SELECT id
    FROM workspace
    ORDER BY created_at ASC
    LIMIT 1
), usr AS (
    SELECT id
    FROM "user"
    ORDER BY created_at ASC
    LIMIT 1
)
INSERT INTO project (
    id,
    workspace_id,
    title,
    description,
    icon,
    status,
    lead_type,
    lead_id,
    priority,
    created_at,
    updated_at
)
SELECT
    '70000000-0000-0000-0000-000000000001'::uuid,
    ws.id,
    '供应链异常闭环演示项目',
    '聚焦爆品断货、区域库存失衡、供应商延期、预测偏差和复盘闭环，用更少的任务演示异常识别、诊断、仿真、审批、执行与复盘。',
    'package',
    'in_progress',
    'member',
    usr.id,
    'high',
    TIMESTAMPTZ '2026-04-10 09:00:00+08',
    TIMESTAMPTZ '2026-04-13 21:00:00+08'
FROM ws
CROSS JOIN usr
ON CONFLICT (id) DO UPDATE
SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    icon = EXCLUDED.icon,
    status = EXCLUDED.status,
    lead_type = EXCLUDED.lead_type,
    lead_id = EXCLUDED.lead_id,
    priority = EXCLUDED.priority,
    updated_at = EXCLUDED.updated_at;

-- Upsert demo connector metadata.
WITH ws AS (
    SELECT id
    FROM workspace
    ORDER BY created_at ASC
    LIMIT 1
)
INSERT INTO connector (
    id,
    workspace_id,
    name,
    kind,
    base_url,
    capability,
    config,
    allowed_actions,
    health_status,
    last_health_check,
    created_at,
    updated_at
)
SELECT
    '76000000-0000-0000-0000-000000000001'::uuid,
    ws.id,
    '供应链执行连接器',
    'erp',
    'https://demo-erp.internal',
    'read_write',
    jsonb_build_object(
        'owner', '供应链中台',
        'region', 'cn-east-1',
        'note', '用于补货、调拨与采购建议演示'
    ),
    ARRAY[
        'inventory.transfer.create',
        'purchase.plan.create',
        'replenishment.order.create'
    ]::text[],
    'healthy',
    TIMESTAMPTZ '2026-04-13 20:20:00+08',
    TIMESTAMPTZ '2026-04-10 09:00:00+08',
    TIMESTAMPTZ '2026-04-13 20:20:00+08'
FROM ws
ON CONFLICT (id) DO UPDATE
SET
    name = EXCLUDED.name,
    kind = EXCLUDED.kind,
    base_url = EXCLUDED.base_url,
    capability = EXCLUDED.capability,
    config = EXCLUDED.config,
    allowed_actions = EXCLUDED.allowed_actions,
    health_status = EXCLUDED.health_status,
    last_health_check = EXCLUDED.last_health_check,
    updated_at = EXCLUDED.updated_at;

-- Insert the simplified decision tasks.
WITH ws AS (
    SELECT id
    FROM workspace
    ORDER BY created_at ASC
    LIMIT 1
), usr AS (
    SELECT id
    FROM "user"
    ORDER BY created_at ASC
    LIMIT 1
), agent_pool AS (
    SELECT
        MAX(id::text) FILTER (WHERE name = '异常处理Agent')::uuid AS alert_agent_id,
        MAX(id::text) FILTER (WHERE name = '治理 Agent')::uuid AS governance_agent_id
    FROM agent
    WHERE owner_id = (SELECT id FROM usr)
), decision_seed (
    issue_id,
    title,
    description,
    issue_status,
    priority,
    assignee_type,
    assignee_ref,
    due_date,
    domain,
    decision_type,
    object_type,
    object_id,
    objective,
    constraints,
    risk_level,
    execution_mode,
    phase,
    approval_status,
    execution_status,
    created_at,
    updated_at,
    sort_order
) AS (
    VALUES
        (
            '71000000-0000-0000-0000-00000000a001'::uuid,
            '季节性备货排期：端午礼盒华南预储窗口',
            $$触发信号：
- 华南 KA 渠道要求 4 月 28 日前完成首批铺货
- 现有礼盒库存只够 6 天，包材锁产窗口还剩 3 天
- 3PL 提醒节前一周库容会被饮料项目占满

本任务先做排期和资源锁定，不直接下执行单。需要先把库容、包材和预储节奏定下来，避免节前临时补货把华南仓打爆。$$,
            'backlog',
            'high',
            'agent',
            'alert_agent',
            TIMESTAMPTZ '2026-04-15 18:00:00+08',
            'supply_chain',
            'seasonal_planning',
            'sku_family',
            'FESTIVAL-GIFT-SOUTH',
            '确认华南礼盒预储规模与入仓节奏，让 4 月底首批渠道铺货不断货。',
            '预算增量不超过 180 万元；常温仓利用率不能超过 85%；不新增临时仓；包材锁产最晚 4 月 16 日 12:00 前确认。',
            'high',
            'manual',
            'identified',
            'draft',
            'pending',
            TIMESTAMPTZ '2026-04-12 09:20:00+08',
            TIMESTAMPTZ '2026-04-13 13:10:00+08',
            1
        ),
        (
            '71000000-0000-0000-0000-00000000a002'::uuid,
            '爆品断货响应：电解质饮料华东保供',
            $$触发信号：
- OMS 显示近 24 小时订单暴增 62%
- WMS 显示华东主仓现货只够 0.8 天
- ERP 在途补货延后 2 天，周末大促不会等货

今天要把补货和跨仓调拨组合方案提到审批流里，目标是先稳住 KA 和日销最高的直营门店。$$,
            'in_review',
            'urgent',
            'member',
            'owner',
            TIMESTAMPTZ '2026-04-13 16:30:00+08',
            'supply_chain',
            'emergency_allocation',
            'sku',
            'SKU-ELECTROLYTE-330ML',
            '今天 18:00 前锁定补货加调拨组合方案，确保华东核心 KA 与直营网点未来 72 小时不断货。',
            '先保 KA 和日均销量前 200 门店；调出仓保留不少于 5 天安全库存；总运费控制在 32 万元内；审批通过后 30 分钟内推送 ERP/WMS 沙箱。',
            'critical',
            'semi_auto',
            'awaiting_approval',
            'pending',
            'pending',
            TIMESTAMPTZ '2026-04-13 09:50:00+08',
            TIMESTAMPTZ '2026-04-13 15:05:00+08',
            2
        ),
        (
            '71000000-0000-0000-0000-00000000a003'::uuid,
            '区域库存失衡：华东缺货与华南积压联动调拨',
            $$触发信号：
- 华东 3 个重点仓 A 类 SKU 覆盖天数降到 4.2 天
- 华南同批 SKU 覆盖天数达到 21 天，促销后尾货明显
- 财务要求本周不加采购，优先通过内部调拨解决

这条任务要把“缺货”和“积压”一起处理，先拿出一版多仓联动方案，再决定是否进入审批。$$,
            'in_progress',
            'high',
            'member',
            'owner',
            TIMESTAMPTZ '2026-04-14 12:00:00+08',
            'supply_chain',
            'inventory_rebalance',
            'region_inventory',
            'INV-BALANCE-EAST-SOUTH',
            '拿出一版可执行的跨仓调拨方案，把华东缺货风险拉回安全线，同时把华南积压 SKU 压回目标区间。',
            '只能动 A 类 SKU；不新增采购；跨区运费不超过 40 万元；调拨后华南仓覆盖天数不低于 10 天。',
            'high',
            'semi_auto',
            'recommending',
            'draft',
            'pending',
            TIMESTAMPTZ '2026-04-13 08:10:00+08',
            TIMESTAMPTZ '2026-04-13 14:40:00+08',
            3
        ),
        (
            '71000000-0000-0000-0000-00000000a004'::uuid,
            '供应商延期处置：华东纸箱替代供应切换',
            $$触发信号：
- ERP 显示主纸箱供应商 3 张采购单平均延期 5 天
- OTD 连续 3 周跌破 75%
- 大促礼盒外箱预计从 4 月 17 日开始出现缺口

这条任务先把风险和替代节奏看清楚，只允许产出内部采购建议，不直接下正式采购单。$$,
            'in_progress',
            'urgent',
            'member',
            'owner',
            TIMESTAMPTZ '2026-04-14 18:00:00+08',
            'supply_chain',
            'risk_mitigation',
            'supplier',
            'SUP-BOX-EAST-01',
            '在不影响 4 月大促出库的前提下，明确主供应商保留量、替补厂切入节奏和试单范围。',
            '替补厂试单 48 小时内出结论；价格上浮控制在 6% 内；新增质检流程不能超过 5 天；本期只允许创建内部采购建议，不直接下正式采购单。',
            'critical',
            'manual',
            'diagnosing',
            'draft',
            'pending',
            TIMESTAMPTZ '2026-04-12 17:30:00+08',
            TIMESTAMPTZ '2026-04-13 11:20:00+08',
            4
        ),
        (
            '71000000-0000-0000-0000-00000000a005'::uuid,
            '预测偏差修正：618 零食礼包销量上修',
            $$触发信号：
- 近 7 天预测误差达到 +19%
- 营销新增 8 场直播和 2 个团购渠道
- 包材与成品采购还沿用旧 forecast，预计 4 月 16 日起出现缺料

这条任务要先跑完上修后的需求场景，再同步采购提前量和产线爬坡节奏。$$,
            'todo',
            'high',
            'member',
            'owner',
            TIMESTAMPTZ '2026-04-13 20:00:00+08',
            'supply_chain',
            'demand_forecast',
            'forecast_cycle',
            'FC-618-SNACK-2026',
            '今天内完成未来 14 天需求上修，并同步给出采购提前量和产线爬坡节奏，避免 618 预热阶段断货。',
            '预测修正不能突破已批营销预算；产线连续加班不超过 5 天；采购提前量最多前移 2 批；预测版本必须可复盘。',
            'high',
            'manual',
            'simulating',
            'draft',
            'pending',
            TIMESTAMPTZ '2026-04-13 09:05:00+08',
            TIMESTAMPTZ '2026-04-13 12:45:00+08',
            5
        ),
        (
            '71000000-0000-0000-0000-00000000a006'::uuid,
            '保供复盘：无糖茶华北调拨效果复核',
            $$背景：
- 上周已经执行华东到华北 18,400 箱调拨
- 现在需要确认缺货率、周转天数和活动履约是否真的达标
- 这条任务只做复盘总结，不再新增动作执行

复盘结论会直接沉淀到五一前的保供规则里，方便下次不用再从零判断。$$,
            'done',
            'medium',
            'agent',
            'governance_agent',
            TIMESTAMPTZ '2026-04-15 12:00:00+08',
            'supply_chain',
            'inventory_rebalance',
            'sku',
            'SKU-TEA-SUGARFREE-500ML',
            '完成 D+5 复盘，确认这次保供策略是否值得复制到五一档期。',
            '复盘口径必须使用同一批快照；需要给出正负偏差原因；只输出规则结论，不产生新动作单据。',
            'low',
            'semi_auto',
            'monitoring',
            'approved',
            'completed',
            TIMESTAMPTZ '2026-04-11 10:00:00+08',
            TIMESTAMPTZ '2026-04-13 18:20:00+08',
            6
        )
), base AS (
    SELECT
        COALESCE(MAX(number), 0) AS max_number,
        COALESCE(MAX(position), 0) AS max_position
    FROM issue
    WHERE workspace_id = (SELECT id FROM ws)
)
INSERT INTO issue (
    id,
    workspace_id,
    title,
    description,
    status,
    priority,
    assignee_type,
    assignee_id,
    creator_type,
    creator_id,
    project_id,
    number,
    position,
    due_date,
    created_at,
    updated_at
)
SELECT
    seed.issue_id,
    ws.id,
    seed.title,
    seed.description,
    seed.issue_status,
    seed.priority,
    seed.assignee_type,
    CASE seed.assignee_ref
        WHEN 'owner' THEN usr.id
        WHEN 'alert_agent' THEN agent_pool.alert_agent_id
        WHEN 'governance_agent' THEN agent_pool.governance_agent_id
        ELSE NULL
    END,
    'member',
    usr.id,
    '70000000-0000-0000-0000-000000000001'::uuid,
    base.max_number + seed.sort_order,
    base.max_position + seed.sort_order,
    seed.due_date,
    seed.created_at,
    seed.updated_at
FROM decision_seed AS seed
CROSS JOIN ws
CROSS JOIN usr
CROSS JOIN agent_pool
CROSS JOIN base;

-- Insert decision cases for the new tasks.
WITH ws AS (
    SELECT id
    FROM workspace
    ORDER BY created_at ASC
    LIMIT 1
), decision_seed (
    issue_id,
    domain,
    decision_type,
    object_type,
    object_id,
    objective,
    constraints,
    risk_level,
    execution_mode,
    phase,
    approval_status,
    execution_status,
    created_at,
    updated_at
) AS (
    VALUES
        (
            '71000000-0000-0000-0000-00000000a001'::uuid,
            'supply_chain',
            'seasonal_planning',
            'sku_family',
            'FESTIVAL-GIFT-SOUTH',
            '确认华南礼盒预储规模与入仓节奏，让 4 月底首批渠道铺货不断货。',
            '预算增量不超过 180 万元；常温仓利用率不能超过 85%；不新增临时仓；包材锁产最晚 4 月 16 日 12:00 前确认。',
            'high',
            'manual',
            'identified',
            'draft',
            'pending',
            TIMESTAMPTZ '2026-04-12 09:20:00+08',
            TIMESTAMPTZ '2026-04-13 13:10:00+08'
        ),
        (
            '71000000-0000-0000-0000-00000000a002'::uuid,
            'supply_chain',
            'emergency_allocation',
            'sku',
            'SKU-ELECTROLYTE-330ML',
            '今天 18:00 前锁定补货加调拨组合方案，确保华东核心 KA 与直营网点未来 72 小时不断货。',
            '先保 KA 和日均销量前 200 门店；调出仓保留不少于 5 天安全库存；总运费控制在 32 万元内；审批通过后 30 分钟内推送 ERP/WMS 沙箱。',
            'critical',
            'semi_auto',
            'awaiting_approval',
            'pending',
            'pending',
            TIMESTAMPTZ '2026-04-13 09:50:00+08',
            TIMESTAMPTZ '2026-04-13 15:05:00+08'
        ),
        (
            '71000000-0000-0000-0000-00000000a003'::uuid,
            'supply_chain',
            'inventory_rebalance',
            'region_inventory',
            'INV-BALANCE-EAST-SOUTH',
            '拿出一版可执行的跨仓调拨方案，把华东缺货风险拉回安全线，同时把华南积压 SKU 压回目标区间。',
            '只能动 A 类 SKU；不新增采购；跨区运费不超过 40 万元；调拨后华南仓覆盖天数不低于 10 天。',
            'high',
            'semi_auto',
            'recommending',
            'draft',
            'pending',
            TIMESTAMPTZ '2026-04-13 08:10:00+08',
            TIMESTAMPTZ '2026-04-13 14:40:00+08'
        ),
        (
            '71000000-0000-0000-0000-00000000a004'::uuid,
            'supply_chain',
            'risk_mitigation',
            'supplier',
            'SUP-BOX-EAST-01',
            '在不影响 4 月大促出库的前提下，明确主供应商保留量、替补厂切入节奏和试单范围。',
            '替补厂试单 48 小时内出结论；价格上浮控制在 6% 内；新增质检流程不能超过 5 天；本期只允许创建内部采购建议，不直接下正式采购单。',
            'critical',
            'manual',
            'diagnosing',
            'draft',
            'pending',
            TIMESTAMPTZ '2026-04-12 17:30:00+08',
            TIMESTAMPTZ '2026-04-13 11:20:00+08'
        ),
        (
            '71000000-0000-0000-0000-00000000a005'::uuid,
            'supply_chain',
            'demand_forecast',
            'forecast_cycle',
            'FC-618-SNACK-2026',
            '今天内完成未来 14 天需求上修，并同步给出采购提前量和产线爬坡节奏，避免 618 预热阶段断货。',
            '预测修正不能突破已批营销预算；产线连续加班不超过 5 天；采购提前量最多前移 2 批；预测版本必须可复盘。',
            'high',
            'manual',
            'simulating',
            'draft',
            'pending',
            TIMESTAMPTZ '2026-04-13 09:05:00+08',
            TIMESTAMPTZ '2026-04-13 12:45:00+08'
        ),
        (
            '71000000-0000-0000-0000-00000000a006'::uuid,
            'supply_chain',
            'inventory_rebalance',
            'sku',
            'SKU-TEA-SUGARFREE-500ML',
            '完成 D+5 复盘，确认这次保供策略是否值得复制到五一档期。',
            '复盘口径必须使用同一批快照；需要给出正负偏差原因；只输出规则结论，不产生新动作单据。',
            'low',
            'semi_auto',
            'monitoring',
            'approved',
            'completed',
            TIMESTAMPTZ '2026-04-11 10:00:00+08',
            TIMESTAMPTZ '2026-04-13 18:20:00+08'
        )
)
INSERT INTO decision_case (
    issue_id,
    workspace_id,
    project_id,
    domain,
    decision_type,
    object_type,
    object_id,
    objective,
    constraints,
    risk_level,
    execution_mode,
    phase,
    approval_status,
    execution_status,
    created_at,
    updated_at
)
SELECT
    seed.issue_id,
    ws.id,
    '70000000-0000-0000-0000-000000000001'::uuid,
    seed.domain,
    seed.decision_type,
    seed.object_type,
    seed.object_id,
    seed.objective,
    seed.constraints,
    seed.risk_level,
    seed.execution_mode,
    seed.phase,
    seed.approval_status,
    seed.execution_status,
    seed.created_at,
    seed.updated_at
FROM decision_seed AS seed
CROSS JOIN ws;

-- Insert recommendation summaries.
WITH ws AS (
    SELECT id
    FROM workspace
    ORDER BY created_at ASC
    LIMIT 1
)
INSERT INTO decision_recommendation (
    id,
    decision_case_id,
    workspace_id,
    scenario_option_id,
    title,
    rationale,
    expected_impact,
    confidence_score,
    model_version,
    skill_version,
    created_at
)
SELECT
    rec.id,
    rec.decision_case_id,
    ws.id,
    NULL,
    rec.title,
    rec.rationale,
    rec.expected_impact,
    rec.confidence_score,
    rec.model_version,
    rec.skill_version,
    rec.created_at
FROM ws
CROSS JOIN (
    VALUES
        (
            '72000000-0000-0000-0000-000000000001'::uuid,
            '71000000-0000-0000-0000-00000000a002'::uuid,
            '先从华中仓调拨 9,600 箱，再追加 18,000 箱加急补货',
            '华中仓库存健康、运输半径最优，先调拨可以最快救火；加急补货作为第二层兜底，避免周末活动再被打穿。',
            '预计 6 小时内恢复 82% 重点门店可售，72 小时缺货率从 11.4% 降到 2.3%；总运费约 28 万元，华中仓仍保留 6.5 天安全库存。',
            0.94::numeric,
            'scm-copilot-2026-04',
            'emergency-allocation-v3',
            TIMESTAMPTZ '2026-04-13 14:55:00+08'
        ),
        (
            '72000000-0000-0000-0000-000000000002'::uuid,
            '71000000-0000-0000-0000-00000000a003'::uuid,
            '优先调拨 A 类 SKU 1.6 万箱，暂停华南尾货补单',
            '现在的重点不是所有 SKU 一起挪，而是先救 7 个 A 类 SKU；暂停华南尾货补单能把仓容和运输额度都让给高周转品。',
            '预计华东重点 SKU 覆盖天数回到 9.8 天，华南积压金额下降约 120 万元；服务水平提升 6.7 个点，运费控制在 34 万元以内。',
            0.87::numeric,
            'scm-copilot-2026-04',
            'inventory-balance-v2',
            TIMESTAMPTZ '2026-04-13 14:30:00+08'
        ),
        (
            '72000000-0000-0000-0000-000000000003'::uuid,
            '71000000-0000-0000-0000-00000000a004'::uuid,
            '主供应商保留 60%，苏州 B 厂承接 40% 应急产能',
            '主供应商还不能完全切掉，否则会放大切换风险；先让苏州 B 厂承接 40% 应急产能，能在风险和成本之间找到更稳的平衡点。',
            '可把 4 月下旬纸箱缺口从 26 万套压到 4 万套以内；综合成本上浮 4.8%，试单 48 小时后可决定是否继续放量。',
            0.85::numeric,
            'scm-copilot-2026-04',
            'supplier-switch-v2',
            TIMESTAMPTZ '2026-04-13 11:05:00+08'
        ),
        (
            '72000000-0000-0000-0000-000000000004'::uuid,
            '71000000-0000-0000-0000-00000000a005'::uuid,
            '未来 14 天基线预测上调 22%，采购提前两批锁产',
            '新增直播和团购渠道已经提前释放了真实锁量，继续沿用旧 forecast 只会把缺料问题后置；先上修预测，再把采购和产线节奏前移两批更稳。',
            '预计 618 预热期缺料风险从高降到中，爆单缺货减少约 18%，同时把加急采购比例压在 15% 以内。',
            0.9::numeric,
            'scm-copilot-2026-04',
            'forecast-correction-v3',
            TIMESTAMPTZ '2026-04-13 12:35:00+08'
        )
) AS rec (
    id,
    decision_case_id,
    title,
    rationale,
    expected_impact,
    confidence_score,
    model_version,
    skill_version,
    created_at
);

-- Insert approval summaries for the approval-stage and review-stage tasks.
WITH ws AS (
    SELECT id
    FROM workspace
    ORDER BY created_at ASC
    LIMIT 1
), usr AS (
    SELECT id
    FROM "user"
    ORDER BY created_at ASC
    LIMIT 1
)
INSERT INTO decision_approval (
    id,
    decision_case_id,
    workspace_id,
    approver_type,
    approver_id,
    status,
    comment,
    sort_order,
    created_at,
    updated_at
)
SELECT
    approval.id,
    approval.decision_case_id,
    ws.id,
    approval.approver_type,
    usr.id,
    approval.status,
    approval.comment,
    approval.sort_order,
    approval.created_at,
    approval.updated_at
FROM ws
CROSS JOIN usr
CROSS JOIN (
    VALUES
        (
            '74000000-0000-0000-0000-000000000001'::uuid,
            '71000000-0000-0000-0000-00000000a002'::uuid,
            'user'::text,
            'pending'::text,
            '待供应链负责人确认 KA 与直营网点优先级后放行调拨申请。',
            1,
            TIMESTAMPTZ '2026-04-13 15:00:00+08',
            TIMESTAMPTZ '2026-04-13 15:05:00+08'
        ),
        (
            '74000000-0000-0000-0000-000000000002'::uuid,
            '71000000-0000-0000-0000-00000000a006'::uuid,
            'user'::text,
            'approved'::text,
            '复盘结果已确认达标，可以把这次跨仓保供规则沉淀到五一前置预案。',
            1,
            TIMESTAMPTZ '2026-04-13 18:10:00+08',
            TIMESTAMPTZ '2026-04-13 18:20:00+08'
        )
) AS approval (
    id,
    decision_case_id,
    approver_type,
    status,
    comment,
    sort_order,
    created_at,
    updated_at
);

-- Insert latest snapshot summaries.
WITH ws AS (
    SELECT id
    FROM workspace
    ORDER BY created_at ASC
    LIMIT 1
)
INSERT INTO decision_context_snapshot (
    id,
    decision_case_id,
    workspace_id,
    source,
    source_ref,
    metrics,
    captured_at,
    created_at
)
SELECT
    snapshot.id,
    snapshot.decision_case_id,
    ws.id,
    snapshot.source,
    snapshot.source_ref,
    snapshot.metrics,
    snapshot.captured_at,
    snapshot.created_at
FROM ws
CROSS JOIN (
    VALUES
        (
            '75000000-0000-0000-0000-000000000001'::uuid,
            '71000000-0000-0000-0000-00000000a002'::uuid,
            'oms_wms_merge'::text,
            'SKU-ELECTROLYTE-330ML/2026-04-13-1000'::text,
            jsonb_build_object(
                'orders_24h_growth_pct', 0.62,
                'inventory_days', 0.8,
                'inbound_delay_days', 2,
                'core_store_count', 200
            ),
            TIMESTAMPTZ '2026-04-13 10:00:00+08',
            TIMESTAMPTZ '2026-04-13 10:02:00+08'
        ),
        (
            '75000000-0000-0000-0000-000000000002'::uuid,
            '71000000-0000-0000-0000-00000000a003'::uuid,
            'inventory_balance'::text,
            'EAST-SOUTH-A-SKU/2026-W15'::text,
            jsonb_build_object(
                'east_inventory_days', 4.2,
                'south_inventory_days', 21.0,
                'excess_units', 18500,
                'at_risk_skus', 7
            ),
            TIMESTAMPTZ '2026-04-13 13:40:00+08',
            TIMESTAMPTZ '2026-04-13 13:42:00+08'
        ),
        (
            '75000000-0000-0000-0000-000000000003'::uuid,
            '71000000-0000-0000-0000-00000000a004'::uuid,
            'supplier_scorecard'::text,
            'SUP-BOX-EAST-01/2026-W15'::text,
            jsonb_build_object(
                'otd', 0.74,
                'delayed_po_count', 3,
                'defect_rate', 0.019,
                'shortage_units', 260000
            ),
            TIMESTAMPTZ '2026-04-13 10:40:00+08',
            TIMESTAMPTZ '2026-04-13 10:41:00+08'
        ),
        (
            '75000000-0000-0000-0000-000000000004'::uuid,
            '71000000-0000-0000-0000-00000000a005'::uuid,
            'forecast_watch'::text,
            'SKU-SNACK-GIFT-618/2026-W15'::text,
            jsonb_build_object(
                'mape_7d', 0.19,
                'live_sessions_added', 8,
                'group_buy_locked_units', 46000,
                'material_gap_start_in_days', 3
            ),
            TIMESTAMPTZ '2026-04-13 11:55:00+08',
            TIMESTAMPTZ '2026-04-13 12:00:00+08'
        ),
        (
            '75000000-0000-0000-0000-000000000005'::uuid,
            '71000000-0000-0000-0000-00000000a006'::uuid,
            'bi_review'::text,
            'SKU-TEA-SUGARFREE-500ML/D+5'::text,
            jsonb_build_object(
                'stockout_rate', 0.011,
                'service_level', 0.984,
                'transfer_units', 18400,
                'turnover_days', 9.6
            ),
            TIMESTAMPTZ '2026-04-13 18:00:00+08',
            TIMESTAMPTZ '2026-04-13 18:02:00+08'
        )
) AS snapshot (
    id,
    decision_case_id,
    source,
    source_ref,
    metrics,
    captured_at,
    created_at
);

-- Insert execution traces.
WITH ws AS (
    SELECT id
    FROM workspace
    ORDER BY created_at ASC
    LIMIT 1
)
INSERT INTO action_run (
    id,
    decision_case_id,
    workspace_id,
    idempotency_key,
    connector_id,
    action_type,
    request_payload,
    external_ref,
    rollback_payload,
    status,
    runtime_id,
    error_message,
    started_at,
    completed_at,
    created_at,
    updated_at
)
SELECT
    action.id,
    action.decision_case_id,
    ws.id,
    action.idempotency_key,
    action.connector_id,
    action.action_type,
    action.request_payload,
    action.external_ref,
    action.rollback_payload,
    action.status,
    NULL::uuid,
    ''::text,
    action.started_at,
    action.completed_at,
    action.created_at,
    action.updated_at
FROM ws
CROSS JOIN (
    VALUES
        (
            '77000000-0000-0000-0000-000000000001'::uuid,
            '71000000-0000-0000-0000-00000000a002'::uuid,
            'decision-action-71000000-0000-0000-0000-00000000a002',
            '76000000-0000-0000-0000-000000000001'::uuid,
            'inventory.transfer.create'::text,
            jsonb_build_object(
                'sku', 'SKU-ELECTROLYTE-330ML',
                'from_warehouse', 'WH-CENTRAL-02',
                'to_warehouse', 'WH-EAST-03',
                'quantity', 9600,
                'eta_hours', 8,
                'priority', 'urgent'
            ),
            'ERP-TR-20260413-021'::text,
            jsonb_build_object(
                'action', 'inventory.transfer.cancel',
                'external_ref', 'ERP-TR-20260413-021'
            ),
            'running'::text,
            TIMESTAMPTZ '2026-04-13 15:12:00+08',
            NULL::timestamptz,
            TIMESTAMPTZ '2026-04-13 15:11:30+08',
            TIMESTAMPTZ '2026-04-13 15:12:00+08'
        ),
        (
            '77000000-0000-0000-0000-000000000002'::uuid,
            '71000000-0000-0000-0000-00000000a006'::uuid,
            'decision-action-71000000-0000-0000-0000-00000000a006',
            '76000000-0000-0000-0000-000000000001'::uuid,
            'inventory.transfer.create'::text,
            jsonb_build_object(
                'sku', 'SKU-TEA-SUGARFREE-500ML',
                'from_warehouse', 'WH-EAST-01',
                'to_warehouse', 'WH-NORTH-02',
                'quantity', 18400,
                'priority', 'high'
            ),
            'ERP-TR-20260410-017'::text,
            jsonb_build_object(
                'action', 'inventory.transfer.cancel',
                'external_ref', 'ERP-TR-20260410-017'
            ),
            'completed'::text,
            TIMESTAMPTZ '2026-04-10 15:10:00+08',
            TIMESTAMPTZ '2026-04-10 20:45:00+08',
            TIMESTAMPTZ '2026-04-10 15:09:30+08',
            TIMESTAMPTZ '2026-04-13 18:20:00+08'
        )
) AS action (
    id,
    decision_case_id,
    idempotency_key,
    connector_id,
    action_type,
    request_payload,
    external_ref,
    rollback_payload,
    status,
    started_at,
    completed_at,
    created_at,
    updated_at
);

-- Insert cleaner collaboration notes so task detail pages feel more realistic.
WITH ws AS (
    SELECT id
    FROM workspace
    ORDER BY created_at ASC
    LIMIT 1
), usr AS (
    SELECT id
    FROM "user"
    ORDER BY created_at ASC
    LIMIT 1
), agent_pool AS (
    SELECT
        MAX(id::text) FILTER (WHERE name = '异常处理Agent')::uuid AS alert_agent_id,
        MAX(id::text) FILTER (WHERE name = '调拨分配 Agent')::uuid AS transfer_agent_id,
        MAX(id::text) FILTER (WHERE name = '采购计划 Agent')::uuid AS procurement_agent_id,
        MAX(id::text) FILTER (WHERE name = '需求预测 Agent')::uuid AS forecast_agent_id,
        MAX(id::text) FILTER (WHERE name = '治理 Agent')::uuid AS governance_agent_id
    FROM agent
    WHERE owner_id = (SELECT id FROM usr)
)
INSERT INTO comment (
    id,
    issue_id,
    author_type,
    author_id,
    content,
    type,
    created_at,
    updated_at,
    parent_id,
    workspace_id
)
SELECT
    note.id,
    note.issue_id,
    note.author_type,
    CASE note.author_ref
        WHEN 'owner' THEN usr.id
        WHEN 'alert_agent' THEN agent_pool.alert_agent_id
        WHEN 'transfer_agent' THEN agent_pool.transfer_agent_id
        WHEN 'procurement_agent' THEN agent_pool.procurement_agent_id
        WHEN 'forecast_agent' THEN agent_pool.forecast_agent_id
        WHEN 'governance_agent' THEN agent_pool.governance_agent_id
        ELSE usr.id
    END,
    note.content,
    note.type,
    note.created_at,
    note.updated_at,
    NULL::uuid,
    ws.id
FROM ws
CROSS JOIN usr
CROSS JOIN agent_pool
CROSS JOIN (
    VALUES
        (
            '79000000-0000-0000-0000-000000000001'::uuid,
            '71000000-0000-0000-0000-00000000a001'::uuid,
            'agent'::text,
            'alert_agent'::text,
            $$我先把这条任务放在排期池，不是因为已经缺货，而是因为窗口很窄。建议先锁三件事：

1. 华南 3PL 4/20-4/28 的常温库容
2. 礼盒外箱与隔板的锁产时间
3. KA 渠道首批铺货顺序

库容和包材确认前，不建议直接进入审批流。$$,
            'comment'::text,
            TIMESTAMPTZ '2026-04-13 13:10:00+08',
            TIMESTAMPTZ '2026-04-13 13:10:00+08'
        ),
        (
            '79000000-0000-0000-0000-000000000002'::uuid,
            '71000000-0000-0000-0000-00000000a002'::uuid,
            'agent'::text,
            'transfer_agent'::text,
            $$我比对了 3 个可调出仓：

- 华中仓可调 9,600 箱，8 小时可达，影响最小
- 华南仓不能再抽货，否则周末活动库存会被打穿
- 华北仓运费高 18%，只适合作为最后兜底

建议按“先调拨、后加急补货”的顺序执行。$$,
            'comment'::text,
            TIMESTAMPTZ '2026-04-13 14:48:00+08',
            TIMESTAMPTZ '2026-04-13 14:48:00+08'
        ),
        (
            '79000000-0000-0000-0000-000000000003'::uuid,
            '71000000-0000-0000-0000-00000000a002'::uuid,
            'member'::text,
            'owner'::text,
            $$我这边等运营总监在 15:30 前确认 KA 与直营网点优先级。审批一过，就把调拨申请和加急补货同时推到沙箱。$$,
            'comment'::text,
            TIMESTAMPTZ '2026-04-13 15:00:00+08',
            TIMESTAMPTZ '2026-04-13 15:00:00+08'
        ),
        (
            '79000000-0000-0000-0000-000000000004'::uuid,
            '71000000-0000-0000-0000-00000000a003'::uuid,
            'agent'::text,
            'transfer_agent'::text,
            $$华东真正缺的不是所有 SKU，而是 7 个 A 类 SKU。按 1.6 万箱方案调拨后，华东覆盖天数可以回到 9.8 天，华南仍保留 11 天安全库存。$$,
            'comment'::text,
            TIMESTAMPTZ '2026-04-13 14:05:00+08',
            TIMESTAMPTZ '2026-04-13 14:05:00+08'
        ),
        (
            '79000000-0000-0000-0000-000000000005'::uuid,
            '71000000-0000-0000-0000-00000000a004'::uuid,
            'agent'::text,
            'procurement_agent'::text,
            $$主供应商延期根因不是单一产能不足，而是版辊返修和纸浆切换叠加。苏州 B 厂最快 4/16 上午可以出首批 8 万套试单，建议只放 40% 产能做应急。$$,
            'comment'::text,
            TIMESTAMPTZ '2026-04-13 10:55:00+08',
            TIMESTAMPTZ '2026-04-13 10:55:00+08'
        ),
        (
            '79000000-0000-0000-0000-000000000006'::uuid,
            '71000000-0000-0000-0000-00000000a005'::uuid,
            'agent'::text,
            'forecast_agent'::text,
            $$预测误差主要来自两个新增渠道：直播预约量比基线高 31%，团购锁量高 18%。如果今天不改预测，4/16 起会先缺外箱，再缺成品。$$,
            'comment'::text,
            TIMESTAMPTZ '2026-04-13 12:20:00+08',
            TIMESTAMPTZ '2026-04-13 12:20:00+08'
        ),
        (
            '79000000-0000-0000-0000-000000000007'::uuid,
            '71000000-0000-0000-0000-00000000a006'::uuid,
            'agent'::text,
            'governance_agent'::text,
            $$复盘结论：

- 华北缺货率从 6.2% 降到 1.1%
- 调拨完成后 48 小时内门店补齐率 93%
- 主要问题不是调拨慢，而是审批确认晚了 2 小时

建议把“18:00 前完成保供审批”固化成节假日规则。$$,
            'comment'::text,
            TIMESTAMPTZ '2026-04-13 18:18:00+08',
            TIMESTAMPTZ '2026-04-13 18:18:00+08'
        )
) AS note (
    id,
    issue_id,
    author_type,
    author_ref,
    content,
    type,
    created_at,
    updated_at
);
