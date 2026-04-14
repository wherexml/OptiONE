const DEFAULT_PROJECT_ICON = "📁";

const LEGACY_PROJECT_ICON_MAP: Record<string, string> = {
  box: "📦",
  folder: "📁",
  package: "📦",
};

const LEGACY_ICON_TOKEN_PATTERN = /^[a-z0-9_-]+$/i;

export function getProjectIconValue(icon?: string | null): string {
  const trimmed = icon?.trim();

  if (!trimmed) {
    return DEFAULT_PROJECT_ICON;
  }

  if (!LEGACY_ICON_TOKEN_PATTERN.test(trimmed)) {
    return trimmed;
  }

  return LEGACY_PROJECT_ICON_MAP[trimmed.toLowerCase()] ?? DEFAULT_PROJECT_ICON;
}
