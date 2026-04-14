import { describe, expect, it } from "vitest";
import { getProjectIconValue } from "./project-icon";

describe("getProjectIconValue", () => {
  it("maps legacy icon tokens to display emojis", () => {
    expect(getProjectIconValue("package")).toBe("📦");
    expect(getProjectIconValue("folder")).toBe("📁");
  });

  it("falls back to the folder emoji for unknown token strings", () => {
    expect(getProjectIconValue("unknown_token")).toBe("📁");
  });

  it("keeps emoji icons unchanged", () => {
    expect(getProjectIconValue("🚀")).toBe("🚀");
  });
});
