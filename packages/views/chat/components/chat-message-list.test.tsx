import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Agent, ChatMessage } from "@multica/core/types";
import { ChatMessageList } from "./chat-message-list";

function createAgent(overrides: Partial<Agent> = {}): Agent {
  return {
    id: "agent-forecast",
    workspace_id: "ws-1",
    runtime_id: "runtime-1",
    name: "需求预测 Agent",
    description: "看未来 7/14/30 天需求走势，解释为什么会偏差，并给出修正建议",
    instructions: "",
    avatar_url: null,
    runtime_mode: "local",
    runtime_config: {},
    visibility: "workspace",
    status: "idle",
    max_concurrent_tasks: 1,
    owner_id: null,
    skills: [],
    triggers: [],
    created_at: "2026-04-14T00:00:00Z",
    updated_at: "2026-04-14T00:00:00Z",
    archived_at: null,
    archived_by: null,
    ...overrides,
  };
}

function createMessage(overrides: Partial<ChatMessage> = {}): ChatMessage {
  return {
    id: "msg-1",
    chat_session_id: "session-1",
    role: "assistant",
    content: "这里是回复",
    task_id: null,
    created_at: "2026-04-14T00:00:00Z",
    ...overrides,
  };
}

describe("ChatMessageList", () => {
  it("uses the same domain avatar styling as the agents list", () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <ChatMessageList
          messages={[createMessage()]}
          agent={createAgent()}
          timelineItems={[]}
          isWaiting={false}
        />
      </QueryClientProvider>,
    );

    expect(container.querySelector(".bg-cyan-100.text-cyan-700")).not.toBeNull();
    expect(container.querySelector(".bg-purple-100.text-purple-700")).toBeNull();
  });
});
