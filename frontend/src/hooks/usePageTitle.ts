import { useEffect } from "react";

export function usePageTitle(title: string) {
  useEffect(() => {
    document.title = title === "PatchPilot AI" ? title : `${title} · PatchPilot AI`;
  }, [title]);
}
