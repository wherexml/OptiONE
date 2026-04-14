import type { ReactNode } from "react";
import { describe, expect, it, beforeEach, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { Issue } from "@multica/core/types";
import { InboxPage } from "./inbox-page";

const navigationMock = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
  searchParams: new URLSearchParams(),
}));

const apiMock = vi.hoisted(() => ({
  listInbox: vi.fn(),
  listIssues: vi.fn(),
  listDecisions: vi.fn(),
}));

vi.mock("@multica/core/auth", () => ({
  useAuthStore: (selector?: (state: { user: { id: string } | null }) => unknown) => {
    const state = { user: { id: "user-1" } };
    return selector ? selector(state) : state;
  },
}));

vi.mock("@multica/core/api", () => ({
  api: apiMock,
}));

vi.mock("@multica/core/hooks", () => ({
  useWorkspaceId: () => "ws-1",
}));

vi.mock("@multica/core/modals", () => ({
  useModalStore: {
    getState: () => ({
      open: vi.fn(),
    }),
  },
}));

vi.mock("@multica/core/inbox/mutations", () => ({
  useArchiveAllInbox: () => ({ mutate: vi.fn() }),
  useArchiveAllReadInbox: () => ({ mutate: vi.fn() }),
  useArchiveCompletedInbox: () => ({ mutate: vi.fn() }),
  useArchiveInbox: () => ({ mutate: vi.fn() }),
  useMarkAllInboxRead: () => ({ mutate: vi.fn() }),
  useMarkInboxRead: () => ({ mutate: vi.fn() }),
  useConvertAlertToDecision: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock("../../navigation", () => ({
  useNavigation: () => navigationMock,
}));

vi.mock("../../issues/components", () => ({
  IssueDetail: ({ issueId }: { issueId: string }) => (
    <div data-testid="issue-detail">Issue detail: {issueId}</div>
  ),
  StatusIcon: () => <span data-testid="status-icon" />,
}));

vi.mock("@multica/ui/hooks/use-mobile", () => ({
  useIsMobile: () => false,
}));

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock("react-resizable-panels", () => ({
  Group: ({ children, ...props }: { children: ReactNode }) => (
    <div data-testid="panel-group" {...props}>
      {children}
    </div>
  ),
  Panel: ({ children, ...props }: { children: ReactNode }) => (
    <div data-testid="panel" {...props}>
      {children}
    </div>
  ),
  Separator: (props: Record<string, unknown>) => <div data-testid="panel-handle" {...props} />,
  useDefaultLayout: () => ({ defaultLayout: undefined, onLayoutChanged: vi.fn() }),
  usePanelRef: () => ({
    current: {
      isCollapsed: () => false,
      expand: vi.fn(),
      collapse: vi.fn(),
    },
  }),
}));

vi.mock("@multica/ui/components/ui/dropdown-menu", () => ({
  DropdownMenu: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children, render }: { children: ReactNode; render?: ReactNode }) =>
    render ?? <button type="button">{children}</button>,
  DropdownMenuContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DropdownMenuItem: ({ children, onClick }: { children: ReactNode; onClick?: () => void }) => (
    <button type="button" onClick={onClick}>
      {children}
    </button>
  ),
  DropdownMenuSeparator: () => <hr />,
}));

function createIssue(overrides: Partial<Issue> = {}): Issue {
  return {
    id: "issue-1",
    workspace_id: "ws-1",
    number: 1,
    identifier: "ISS-1",
    title: "修复库存告警",
    description: null,
    status: "todo",
    priority: "high",
    assignee_type: "member",
    assignee_id: "user-1",
    creator_type: "member",
    creator_id: "user-1",
    parent_issue_id: null,
    project_id: null,
    position: 1,
    due_date: null,
    created_at: "2026-04-13T10:00:00.000Z",
    updated_at: "2026-04-13T10:00:00.000Z",
    ...overrides,
  };
}

function renderInboxPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <InboxPage />
    </QueryClientProvider>,
  );
}

describe("InboxPage", () => {
  beforeEach(() => {
    navigationMock.push.mockReset();
    navigationMock.replace.mockReset();
    navigationMock.searchParams = new URLSearchParams();

    apiMock.listInbox.mockResolvedValue([]);
    apiMock.listDecisions.mockResolvedValue({ decisions: [], total: 0 });
    apiMock.listIssues.mockImplementation(async (params?: { open_only?: boolean; status?: string }) => {
      if (params?.open_only) {
        return {
          issues: [createIssue()],
          total: 1,
        };
      }

      if (params?.status === "done") {
        return {
          issues: [],
          total: 0,
        };
      }

      return {
        issues: [],
        total: 0,
      };
    });
  });

  it("keeps todo selection in the inbox detail pane instead of navigating away", async () => {
    renderInboxPage();

    const todoButton = await screen.findByRole("button", {
      name: /ISS-1.*修复库存告警/i,
    });
    fireEvent.click(todoButton);

    await waitFor(() => {
      expect(screen.getByTestId("issue-detail")).toHaveTextContent("Issue detail: issue-1");
    });

    expect(navigationMock.push).not.toHaveBeenCalled();
    expect(navigationMock.replace).toHaveBeenCalledWith("/inbox?issue=issue-1");
  });
});
