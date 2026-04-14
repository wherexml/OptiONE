"use client";

import type { Agent } from "@multica/core/types";
import { ActorAvatar as ActorAvatarBase } from "@multica/ui/components/common/actor-avatar";
import { cn } from "@multica/ui/lib/utils";
import { getAgentDomainMeta } from "../agents/components/agent-meta";

interface AgentAvatarProps {
  agent: Pick<Agent, "name" | "description" | "avatar_url" | "archived_at">;
  size?: number;
  className?: string;
}

function getAgentInitials(name: string): string {
  const normalized = name.trim();

  if (!normalized) {
    return "A";
  }

  return normalized.slice(0, 2).toUpperCase();
}

export function AgentAvatar({
  agent,
  size = 20,
  className,
}: AgentAvatarProps) {
  const domainMeta = getAgentDomainMeta(
    `${agent.name} ${agent.description ?? ""}`,
  );

  return (
    <ActorAvatarBase
      name={agent.name}
      initials={getAgentInitials(agent.name)}
      avatarUrl={agent.avatar_url}
      isAgent={true}
      size={size}
      className={cn(
        "shrink-0 rounded-lg",
        domainMeta.avatarClassName,
        agent.archived_at && "opacity-50 grayscale",
        className,
      )}
    />
  );
}
