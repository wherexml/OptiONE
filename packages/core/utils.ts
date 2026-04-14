import { getClientLocale, getDefaultLocale, normalizeLocale } from "./platform/lexicon";

function getTimeAgoLocale() {
  return normalizeLocale(getClientLocale(getDefaultLocale()));
}

export function timeAgo(dateStr: string): string {
  const locale = getTimeAgoLocale();
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (locale === "zh-CN") {
    if (minutes < 1) return "刚刚";
    if (minutes < 60) return `${minutes}分钟前`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}小时前`;
    const days = Math.floor(hours / 24);
    return `${days}天前`;
  }

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
