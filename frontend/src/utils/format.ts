import type { FindingStatus, StageStatus } from "../types/security";

export function relativeTime(iso: string) {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return iso;
  const minutes = Math.max(0, Math.round((Date.now() - then) / 60000));
  if (minutes < 1) return "Just now";
  if (minutes === 1) return "1 minute ago";
  if (minutes < 60) return `${minutes} minutes ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return hours === 1 ? "1 hour ago" : `${hours} hours ago`;
  return scanDate(iso);
}

export function scanDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const now = new Date();
  if (date.toDateString() === now.toDateString()) return "Today";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function statusLabel(status: FindingStatus) {
  switch (status) {
    case "unfixed":
      return "UNFIXED";
    case "fix_ready":
      return "FIX READY";
    case "applied":
      return "PATCHED";
    case "verified":
      return "VERIFIED";
    case "failed":
      return "FAILED";
  }
}

export function stageLabel(status: StageStatus) {
  return status.toUpperCase();
}

export function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}
