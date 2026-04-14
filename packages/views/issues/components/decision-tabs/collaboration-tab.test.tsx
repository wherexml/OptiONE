import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CollaborationTab } from "./collaboration-tab";

const mockUseQuery = vi.fn();
const mockToggleSubscribe = vi.fn();
const mockToggleSubscriber = vi.fn();

vi.mock("@tanstack/react-query", () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
}));

vi.mock("@multica/core/auth", () => ({
  useAuthStore: (selector: (state: { user: { id: string } }) => unknown) => selector({ user: { id: "user-1" } }),
}));

vi.mock("@multica/core/hooks", () => ({
  useWorkspaceId: () => "ws-1",
}));

vi.mock("@multica/core/platform", () => ({
  getClientLocale: () => "zh-CN",
}));

vi.mock("@multica/core/workspace/hooks", () => ({
  useActorName: () => ({
    getActorName: () => "Steve",
  }),
}));

vi.mock("@multica/core/workspace/queries", () => ({
  memberListOptions: () => ({ queryKey: ["members"] }),
  agentListOptions: () => ({ queryKey: ["agents"] }),
}));

vi.mock("../../hooks/use-issue-timeline", () => ({
  useIssueTimeline: () => ({
    timeline: [],
    loading: false,
    submitComment: vi.fn(),
    submitReply: vi.fn(),
    editComment: vi.fn(),
    deleteComment: vi.fn(),
    toggleReaction: vi.fn(),
  }),
}));

vi.mock("../../hooks/use-issue-subscribers", () => ({
  useIssueSubscribers: () => ({
    subscribers: [{ user_type: "member", user_id: "user-1" }],
    loading: false,
    isSubscribed: true,
    toggleSubscribe: mockToggleSubscribe,
    toggleSubscriber: mockToggleSubscriber,
  }),
}));

vi.mock("@multica/ui/components/ui/avatar", () => ({
  AvatarGroup: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  AvatarGroupCount: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("@multica/ui/components/ui/checkbox", () => ({
  Checkbox: ({ checked }: { checked?: boolean }) => <span>{checked ? "checked" : "unchecked"}</span>,
}));

vi.mock("@multica/ui/components/ui/command", () => ({
  Command: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  CommandInput: ({ placeholder }: { placeholder?: string }) => <input placeholder={placeholder} />,
  CommandList: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  CommandEmpty: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  CommandGroup: ({ heading, children }: { heading: string; children: ReactNode }) => (
    <section>
      <h3>{heading}</h3>
      {children}
    </section>
  ),
  CommandItem: ({ children }: { children: ReactNode }) => <button>{children}</button>,
}));

vi.mock("@multica/ui/components/ui/popover", () => ({
  Popover: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  PopoverTrigger: ({ children }: { children: ReactNode }) => <button>{children}</button>,
  PopoverContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("@multica/ui/components/ui/skeleton", () => ({
  Skeleton: () => <div>loading</div>,
}));

vi.mock("@multica/ui/components/ui/tooltip", () => ({
  Tooltip: ({ children }: { children: ReactNode }) => <>{children}</>,
  TooltipTrigger: ({ children }: { children: ReactNode }) => <>{children}</>,
  TooltipContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("../../../common/actor-avatar", () => ({
  ActorAvatar: ({ actorType }: { actorType: string }) => <span>{actorType}</span>,
}));

vi.mock("../agent-live-card", () => ({
  AgentLiveCard: () => <div>AgentLiveCard</div>,
  TaskRunHistory: () => <div>TaskRunHistory</div>,
}));

vi.mock("../comment-card", () => ({
  CommentCard: () => <div>CommentCard</div>,
}));

vi.mock("../comment-input", () => ({
  CommentInput: () => <div>CommentInput</div>,
}));

describe("CollaborationTab", () => {
  beforeEach(() => {
    mockUseQuery.mockReset();
    mockUseQuery.mockImplementation((options: { queryKey?: string[] }) => {
      switch (options.queryKey?.[0]) {
        case "members":
          return { data: [{ user_id: "user-1", name: "Steve" }] };
        case "agents":
          return { data: [{ id: "agent-1", name: "异常处理Agent", archived_at: null }] };
        default:
          return { data: [] };
      }
    });
  });

  it("shows the Chinese subscriber controls", () => {
    render(<CollaborationTab issueId="issue-1" />);

    expect(screen.getByText("取消订阅")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("更改订阅者...")).toBeInTheDocument();
    expect(screen.getByText("成员")).toBeInTheDocument();
    expect(screen.getByText("数字员工")).toBeInTheDocument();
  });
});
