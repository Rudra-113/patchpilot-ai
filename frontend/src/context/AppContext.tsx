import { createContext, useContext, useMemo, type ReactNode } from "react";
import { demoFindings, demoRepository } from "../data/demo";
import type { Finding } from "../types/security";

type AppState = {
  demoMode: boolean;
  repository: string;
  branch: string;
  lastScanLabel: string;
  source: string;
  findings: Finding[];
};

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const value = useMemo<AppState>(
    () => ({
      demoMode: true,
      repository: demoRepository.name,
      branch: demoRepository.branch,
      lastScanLabel: demoRepository.lastScanLabel,
      source: demoRepository.source,
      findings: demoFindings,
    }),
    [],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppState() {
  const value = useContext(AppContext);
  if (!value) {
    throw new Error("useAppState must be used within AppProvider");
  }
  return value;
}
