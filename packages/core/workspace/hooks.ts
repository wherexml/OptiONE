"use client";

import { useQuery } from "@tanstack/react-query";
import { getClientLocale } from "../platform";
import { useWorkspaceId } from "../hooks";
import { memberListOptions, agentListOptions } from "./queries";

function localizeAgentName(name: string, locale: string): string {
  if (locale !== "zh-CN") return name;
  return name.replace(/\s*Agent$/, " 数字员工");
}

export function useActorName() {
  const wsId = useWorkspaceId();
  const locale = getClientLocale();
  const isZh = locale === "zh-CN";
  const { data: members = [] } = useQuery(memberListOptions(wsId));
  const { data: agents = [] } = useQuery(agentListOptions(wsId));

  const getMemberName = (userId: string) => {
    const m = members.find((m) => m.user_id === userId);
    return m?.name ?? (isZh ? "未知成员" : "Unknown");
  };

  const getAgentName = (agentId: string) => {
    const a = agents.find((a) => a.id === agentId);
    return a ? localizeAgentName(a.name, locale) : (isZh ? "未知数字员工" : "Unknown Agent");
  };

  const getActorName = (type: string, id: string) => {
    if (type === "member") return getMemberName(id);
    if (type === "agent") return getAgentName(id);
    return isZh ? "系统" : "System";
  };

  const getActorInitials = (type: string, id: string) => {
    const name = getActorName(type, id);
    return name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getActorAvatarUrl = (type: string, id: string): string | null => {
    if (type === "member") return members.find((m) => m.user_id === id)?.avatar_url ?? null;
    if (type === "agent") return agents.find((a) => a.id === id)?.avatar_url ?? null;
    return null;
  };

  return { getMemberName, getAgentName, getActorName, getActorInitials, getActorAvatarUrl };
}
