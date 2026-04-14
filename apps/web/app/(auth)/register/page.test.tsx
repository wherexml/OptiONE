import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const {
  mockPush,
  mockReplace,
  mockHydrateWorkspace,
  mockRegister,
  mockListWorkspaces,
  mockSetToken,
  mockSetLoggedInCookie,
} = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockReplace: vi.fn(),
  mockHydrateWorkspace: vi.fn(),
  mockRegister: vi.fn(),
  mockListWorkspaces: vi.fn(),
  mockSetToken: vi.fn(),
  mockSetLoggedInCookie: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@multica/core/auth", () => {
  const authState = {
    user: null,
    isLoading: false,
  };
  const useAuthStore = Object.assign(
    (selector: (s: typeof authState) => unknown) => selector(authState),
    { getState: () => authState },
  );
  return { useAuthStore };
});

vi.mock("@multica/core/workspace", () => {
  const wsState = {
    hydrateWorkspace: mockHydrateWorkspace,
  };
  const useWorkspaceStore = Object.assign(
    (selector: (s: typeof wsState) => unknown) => selector(wsState),
    { getState: () => wsState },
  );
  return { useWorkspaceStore };
});

vi.mock("@multica/core/api", () => ({
  api: {
    register: mockRegister,
    listWorkspaces: mockListWorkspaces,
    setToken: mockSetToken,
  },
}));

vi.mock("@/features/auth/auth-cookie", () => ({
  setLoggedInCookie: mockSetLoggedInCookie,
}));

import RegisterPage from "./page";

describe("RegisterPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("renders the localized register form", () => {
    render(<RegisterPage />);

    expect(screen.getByText("创建账号")).toBeInTheDocument();
    expect(screen.getByText("注册 OptiOne 账号")).toBeInTheDocument();
    expect(screen.getByLabelText("姓名")).toBeInTheDocument();
    expect(screen.getByLabelText("邮箱")).toBeInTheDocument();
    expect(screen.getByLabelText("密码")).toBeInTheDocument();
    expect(screen.getByLabelText("确认密码")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "注册" })).toBeInTheDocument();
  });

  it("stores the session, hydrates workspace, and navigates after register", async () => {
    const workspaces = [
      {
        id: "ws-1",
        name: "Local Dev",
        slug: "local-dev",
        description: null,
        context: null,
        settings: {},
        repos: [],
        issue_prefix: "LOC",
        created_at: "2026-04-13T00:00:00Z",
        updated_at: "2026-04-13T00:00:00Z",
      },
    ];
    mockRegister.mockResolvedValueOnce({ token: "token-456" });
    mockListWorkspaces.mockResolvedValueOnce(workspaces);

    const user = userEvent.setup();
    render(<RegisterPage />);

    await user.type(screen.getByLabelText("姓名"), "Steve");
    await user.type(screen.getByLabelText("邮箱"), "steve@example.com");
    await user.type(screen.getByLabelText("密码"), "password123");
    await user.type(screen.getByLabelText("确认密码"), "password123");
    await user.click(screen.getByRole("button", { name: "注册" }));

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith(
        "Steve",
        "steve@example.com",
        "password123",
      );
    });

    await waitFor(() => {
      expect(mockSetToken).toHaveBeenCalledWith("token-456");
      expect(mockSetLoggedInCookie).toHaveBeenCalled();
      expect(mockHydrateWorkspace).toHaveBeenCalledWith(workspaces);
      expect(mockPush).toHaveBeenCalledWith("/issues");
    });

    expect(localStorage.getItem("multica_token")).toBe("token-456");
  });
});
