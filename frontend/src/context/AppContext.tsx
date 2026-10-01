import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  ApiFailure,
  applyFix as applyFixRequest,
  generateFix as generateFixRequest,
  getHealth,
  getScan,
  getScans,
  getSettings,
  runTests as runTestsRequest,
  scanRepository,
  uploadRepository,
  verifyFix as verifyFixRequest,
} from "../services/api";
import type { Finding, Scan, ScanSummary, SettingsStatus, TestResult, Verification } from "../types/security";
import { relativeTime } from "../utils/format";
import { scoreFromFindings } from "../utils/score";

type Workspace = {
  loading: boolean;
  error: string | null;
  errorDetail: string;
  scan: Scan | null;
  history: ScanSummary[];
  settings: SettingsStatus | null;
  pendingScan: boolean;
  demoMode: boolean;
  repository: string;
  branch: string;
  lastScanLabel: string;
  findings: Finding[];
  securityScore: number;
  refresh: () => Promise<void>;
  startScan: (url: string, branch?: string) => Promise<void>;
  uploadZip: (file: File) => Promise<void>;
  generateFix: (findingId: string) => Promise<Finding>;
  applyFix: (findingId: string) => Promise<Finding>;
  runTests: (findingId: string) => Promise<TestResult>;
  verifyFix: (findingId: string) => Promise<Verification>;
};

const WorkspaceContext = createContext<Workspace | null>(null);

function failureOf(error: unknown) {
  if (error instanceof ApiFailure) return error;
  return new ApiFailure("Request failed.", "The API did not respond.");
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorDetail, setErrorDetail] = useState("");
  const [scan, setScan] = useState<Scan | null>(null);
  const [history, setHistory] = useState<ScanSummary[]>([]);
  const [settings, setSettings] = useState<SettingsStatus | null>(null);
  const [pendingScan, setPendingScan] = useState(false);
  const scanRef = useRef<Scan | null>(null);

  useEffect(() => {
    scanRef.current = scan;
  }, [scan]);

  const refresh = useCallback(async () => {
    setError(null);
    setErrorDetail("");
    try {
      await getHealth();
      const [current, scans, config] = await Promise.all([getScan("current"), getScans(), getSettings()]);
      setScan(current);
      setHistory(scans);
      setSettings(config);
    } catch (caught) {
      const failure = failureOf(caught);
      setError(failure.message);
      setErrorDetail(failure.detail);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!scan || scan.status !== "running") return;
    const timer = window.setInterval(() => {
      void getScan(scan.id)
        .then(async (next) => {
          setScan(next);
          if (next.status !== "running") {
            setHistory(await getScans());
          }
        })
        .catch((caught: unknown) => {
          const failure = failureOf(caught);
          setError(failure.message);
          setErrorDetail(failure.detail);
        });
    }, 400);
    return () => window.clearInterval(timer);
  }, [scan?.id, scan?.status]);

  const reloadActive = useCallback(async () => {
    const current = scanRef.current;
    if (!current) return;
    const [next, scans] = await Promise.all([getScan(current.id), getScans()]);
    setScan(next);
    setHistory(scans);
  }, []);

  const startScan = useCallback(async (url: string, branch = "main") => {
    setPendingScan(true);
    setError(null);
    try {
      const next = await scanRepository({ url, branch });
      setScan(next);
      setHistory(await getScans());
    } finally {
      setPendingScan(false);
    }
  }, []);

  const uploadZip = useCallback(async (file: File) => {
    setPendingScan(true);
    setError(null);
    try {
      const next = await uploadRepository(file);
      setScan(next);
      setHistory(await getScans());
    } finally {
      setPendingScan(false);
    }
  }, []);

  const generateFix = useCallback(
    async (findingId: string) => {
      const finding = await generateFixRequest(findingId);
      await reloadActive();
      return finding;
    },
    [reloadActive],
  );

  const applyFix = useCallback(
    async (findingId: string) => {
      const finding = await applyFixRequest(findingId);
      await reloadActive();
      return finding;
    },
    [reloadActive],
  );

  const runTests = useCallback(
    async (findingId: string) => {
      const result = await runTestsRequest(findingId);
      await reloadActive();
      return result;
    },
    [reloadActive],
  );

  const verifyFix = useCallback(
    async (findingId: string) => {
      const result = await verifyFixRequest(findingId);
      await reloadActive();
      return result;
    },
    [reloadActive],
  );

  const value = useMemo<Workspace>(() => {
    const findings = scan?.findings ?? [];
    return {
      loading,
      error,
      errorDetail,
      scan,
      history,
      settings,
      pendingScan,
      demoMode: scan?.demoMode ?? settings?.demoMode ?? true,
      repository: scan?.repository ?? "patchpilot-demo",
      branch: scan?.branch ?? "main",
      lastScanLabel: scan ? relativeTime(scan.createdAt) : "—",
      findings,
      securityScore: scan ? scoreFromFindings(findings) : 0,
      refresh,
      startScan,
      uploadZip,
      generateFix,
      applyFix,
      runTests,
      verifyFix,
    };
  }, [
    loading,
    error,
    errorDetail,
    scan,
    history,
    settings,
    pendingScan,
    refresh,
    startScan,
    uploadZip,
    generateFix,
    applyFix,
    runTests,
    verifyFix,
  ]);

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useAppState() {
  const value = useContext(WorkspaceContext);
  if (!value) {
    throw new Error("useAppState must be used within AppProvider");
  }
  return value;
}
