"use client";

import type { AgentStatus } from "@multica/core/types";

export type AgentDomainMeta = {
  label: string;
  badgeClassName: string;
  avatarClassName: string;
  capabilities: boolean[];
};

const agentDomainMetaList: Array<AgentDomainMeta & { keywords: string[] }> = [
  {
    label: "异常处理",
    keywords: ["异常处理", "控制塔", "告警", "异常"],
    badgeClassName: "border-info/20 bg-info/10 text-info",
    avatarClassName: "bg-info/10 text-info",
    capabilities: [true, true, true, false, true],
  },
  {
    label: "采购",
    keywords: ["采购"],
    badgeClassName: "border-info/20 bg-info/10 text-info",
    avatarClassName: "bg-info/10 text-info",
    capabilities: [true, false, true, true, false],
  },
  {
    label: "库存",
    keywords: ["库存", "补货"],
    badgeClassName: "border-success/20 bg-success/10 text-success",
    avatarClassName: "bg-success/10 text-success",
    capabilities: [true, true, true, false, true],
  },
  {
    label: "调拨",
    keywords: ["调拨", "仓间", "物流"],
    badgeClassName: "border-warning/20 bg-warning/10 text-warning",
    avatarClassName: "bg-warning/10 text-warning",
    capabilities: [true, true, true, true, false],
  },
  {
    label: "供应商",
    keywords: ["供应商"],
    badgeClassName:
      "border-purple-200 bg-purple-100 text-purple-700 dark:border-purple-500/30 dark:bg-purple-500/20 dark:text-purple-200",
    avatarClassName:
      "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-200",
    capabilities: [true, false, true, false, true],
  },
  {
    label: "预测",
    keywords: ["预测", "需求"],
    badgeClassName:
      "border-cyan-200 bg-cyan-100 text-cyan-700 dark:border-cyan-500/30 dark:bg-cyan-500/20 dark:text-cyan-200",
    avatarClassName:
      "bg-cyan-100 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-200",
    capabilities: [true, true, true, false, false],
  },
  {
    label: "治理",
    keywords: ["治理", "审批", "规则", "边界", "风险"],
    badgeClassName: "border-destructive/20 bg-destructive/10 text-destructive",
    avatarClassName: "bg-destructive/10 text-destructive",
    capabilities: [true, false, false, false, true],
  },
  {
    label: "供应链",
    keywords: ["供应链"],
    badgeClassName: "border-info/20 bg-info/10 text-info",
    avatarClassName: "bg-info/10 text-info",
    capabilities: [true, true, true, false, true],
  },
];

const generalAgentDomainMeta: AgentDomainMeta = {
  label: "通用",
  badgeClassName: "border-border bg-muted text-muted-foreground",
  avatarClassName: "bg-muted text-muted-foreground",
  capabilities: [true, false, true, false, false],
};

export function getAgentDomainMeta(
  description: string | null | undefined,
): AgentDomainMeta {
  const normalizedDescription = description?.trim() ?? "";

  if (!normalizedDescription) {
    return generalAgentDomainMeta;
  }

  return (
    agentDomainMetaList.find(({ keywords }) =>
      keywords.some((keyword) => normalizedDescription.includes(keyword)),
    ) ?? generalAgentDomainMeta
  );
}

export function getAgentStatusLabel(
  status: AgentStatus,
  isArchived: boolean,
): string {
  if (isArchived) return "已归档";
  return status === "offline" ? "离线" : "在线";
}
