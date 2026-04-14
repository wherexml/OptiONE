import { render, screen, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AssigneePicker } from "./assignee-picker";

const mockUseQuery = vi.fn();

vi.mock("@tanstack/react-query", () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
}));

vi.mock("@multica/core/auth", () => ({
  useAuthStore: (selector: (state: { user: { id: string } }) => unknown) => selector({ user: { id: "user-1" } }),
}));

vi.mock("@multica/core/platform", () => ({
  getClientLocale: () => "zh-CN",
}));

vi.mock("@multica/core/hooks", () => ({
  useWorkspaceId: () => "ws-1",
}));

vi.mock("@multica/core/workspace/hooks", () => ({
  useActorName: () => ({
    getActorName: () => "未分配",
  }),
}));

vi.mock("@multica/core/workspace/queries", () => ({
  memberListOptions: () => ({ queryKey: ["members"] }),
  agentListOptions: () => ({ queryKey: ["agents"] }),
  assigneeFrequencyOptions: () => ({ queryKey: ["frequency"] }),
}));

vi.mock("../../../common/actor-avatar", () => ({
  ActorAvatar: ({ actorType }: { actorType: string }) => <span>{actorType}</span>,
}));

vi.mock("./property-picker", () => ({
  PropertyPicker: ({
    trigger,
    children,
    searchPlaceholder,
  }: {
    trigger: ReactNode;
    children: ReactNode;
    searchPlaceholder?: string;
  }) => (
    <div>
      <div data-testid="assignee-trigger">{trigger}</div>
      <div>{searchPlaceholder}</div>
      <div>{children}</div>
    </div>
  ),
  PickerItem: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  PickerSection: ({ label, children }: { label: string; children: ReactNode }) => (
    <section>
      <h3>{label}</h3>
      {children}
    </section>
  ),
  PickerEmpty: () => <div>No results</div>,
}));

describe("AssigneePicker", () => {
  beforeEach(() => {
    mockUseQuery.mockReset();
    mockUseQuery.mockImplementation((options: { queryKey?: string[] }) => {
      switch (options.queryKey?.[0]) {
        case "members":
          return { data: [{ user_id: "user-1", name: "Steve", role: "admin" }] };
        case "agents":
          return { data: [{ id: "agent-1", name: "异常处理Agent", archived_at: null, visibility: "public" }] };
        default:
          return { data: [] };
      }
    });
  });

  it("shows the unassigned icon before the Chinese label and renames the agent section", () => {
    render(
      <AssigneePicker
        assigneeType={null}
        assigneeId={null}
        onUpdate={vi.fn()}
      />,
    );

    const trigger = screen.getByTestId("assignee-trigger");
    expect(within(trigger).getByText("未分配")).toBeInTheDocument();
    expect(trigger.firstElementChild?.tagName.toLowerCase()).toBe("svg");
    expect(screen.getByText("数字员工")).toBeInTheDocument();
  });
});
