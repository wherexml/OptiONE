import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProjectPicker } from "./project-picker";

const mockUseQuery = vi.fn();

vi.mock("@tanstack/react-query", () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
}));

vi.mock("@multica/core/projects/queries", () => ({
  projectListOptions: vi.fn(() => ({ queryKey: ["projects"] })),
}));

vi.mock("@multica/core/hooks", () => ({
  useWorkspaceId: () => "ws-1",
}));

vi.mock("@multica/core/platform", () => ({
  getClientLocale: () => "zh-CN",
}));

vi.mock("@multica/ui/components/ui/dropdown-menu", () => ({
  DropdownMenu: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }: { children: ReactNode }) => <button>{children}</button>,
  DropdownMenuContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DropdownMenuItem: ({ children }: { children: ReactNode }) => <button>{children}</button>,
  DropdownMenuSeparator: () => <hr />,
}));

vi.mock("./project-icon", () => ({
  getProjectIconValue: (icon?: string | null) => icon ?? "📁",
}));

describe("ProjectPicker", () => {
  beforeEach(() => {
    mockUseQuery.mockReset();
  });

  it("shows the Chinese empty-state trigger copy", () => {
    mockUseQuery.mockReturnValue({ data: [] });

    render(<ProjectPicker projectId={null} onUpdate={vi.fn()} />);

    expect(screen.getByText("选择项目")).toBeInTheDocument();
    expect(screen.getByText("暂无项目")).toBeInTheDocument();
  });
});
