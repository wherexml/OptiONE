import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { DecisionCase, InboxItem } from "@multica/core/types";
import { InboxAlertsSection } from "./inbox-alerts-section";

vi.mock("@multica/core/workspace/hooks", () => ({
  useActorName: () => ({
    getActorName: () => "系统",
  }),
}));

const baseAlert: InboxItem = {
  id: "alert-1",
  workspace_id: "ws-1",
  recipient_type: "member",
  recipient_id: "user-1",
  actor_type: "agent",
  actor_id: "agent-1",
  type: "task_failed",
  severity: "action_required",
  issue_id: "issue-1",
  title: "库存波动超阈值",
  body: "建议尽快处理",
  issue_status: "blocked",
  read: false,
  archived: false,
  created_at: "2026-04-13T10:00:00.000Z",
  details: null,
};

const baseDecision: DecisionCase = {
  id: "issue-1",
  title: "库存补货决策",
  description: null,
  status: "todo",
  priority: "high",
  assignee_type: "member",
  assignee_id: "user-1",
  created_at: "2026-04-13T10:00:00.000Z",
  updated_at: "2026-04-13T10:00:00.000Z",
  domain: "supply_chain",
  decision_type: "stockout_risk",
  object_type: "sku",
  object_id: "SKU-1",
  objective: "降低缺货风险",
  constraints: "预算不超支",
  risk_level: "high",
  execution_mode: "manual",
  phase: "identified",
  approval_status: "draft",
  execution_status: "pending",
  project_id: null,
};

describe("InboxAlertsSection", () => {
  it("shows open-decision action when the alert already has a linked decision", () => {
    render(
      <InboxAlertsSection
        inboxItems={[baseAlert]}
        decisions={[baseDecision]}
        filters={{ riskLevel: "all" }}
        isLoading={false}
        onFiltersChange={vi.fn()}
        onSelectItem={vi.fn()}
        onOpenDecision={vi.fn()}
        onConvertAlert={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("button", {
        name: "打开决策单",
      }),
    ).toBeInTheDocument();
  });

  it("shows create-decision action when the alert has not been converted yet", () => {
    render(
      <InboxAlertsSection
        inboxItems={[baseAlert]}
        decisions={[]}
        filters={{ riskLevel: "all" }}
        isLoading={false}
        onFiltersChange={vi.fn()}
        onSelectItem={vi.fn()}
        onOpenDecision={vi.fn()}
        onConvertAlert={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("button", {
        name: "生成决策单",
      }),
    ).toBeInTheDocument();
  });
});
