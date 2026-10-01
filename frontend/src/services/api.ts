import axios from "axios";
import type {
  ActivityEvent,
  Finding,
  HealthResponse,
  Scan,
  ScanSummary,
  SettingsStatus,
  TestResult,
  Verification,
} from "../types/security";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000/api",
  timeout: 60_000,
});

export class ApiFailure extends Error {
  detail: string;

  constructor(message: string, detail = "") {
    super(message);
    this.name = "ApiFailure";
    this.detail = detail;
  }
}

function unwrap(error: unknown): never {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data?.detail as { message?: string; detail?: string } | string | undefined;
    if (typeof data === "string") {
      throw new ApiFailure(data);
    }
    if (data && typeof data === "object") {
      throw new ApiFailure(data.message ?? "Request failed.", data.detail ?? "");
    }
    throw new ApiFailure("The API did not respond.", "Start the PatchPilot backend and try again.");
  }
  throw new ApiFailure("Request failed.");
}

async function request<T>(call: () => Promise<{ data: T }>): Promise<T> {
  try {
    const response = await call();
    return response.data;
  } catch (error) {
    unwrap(error);
  }
}

export function getHealth() {
  return request<HealthResponse>(() => api.get("/health"));
}

export function scanRepository(payload: { url: string; branch?: string }) {
  return request<Scan>(() => api.post("/scan", payload));
}

export function uploadRepository(file: File) {
  const body = new FormData();
  body.append("file", file);
  return request<Scan>(() => api.post("/repositories/upload", body));
}

export function getScan(scanId: string) {
  return request<Scan>(() => api.get(`/scans/${scanId}`));
}

export function getScans() {
  return request<ScanSummary[]>(() => api.get("/scans"));
}

export function getFindings(scanId: string) {
  return request<Finding[]>(() => api.get(`/scans/${scanId}/findings`));
}

export function getFinding(findingId: string) {
  return request<Finding>(() => api.get(`/findings/${findingId}`));
}

export function generateFix(findingId: string) {
  return request<Finding>(() => api.post(`/findings/${findingId}/generate-fix`));
}

export function applyFix(findingId: string) {
  return request<Finding>(() => api.post(`/findings/${findingId}/apply-fix`));
}

export function runTests(findingId: string) {
  return request<TestResult>(() => api.post(`/findings/${findingId}/test`));
}

export function verifyFix(findingId: string) {
  return request<Verification>(() => api.post(`/findings/${findingId}/verify`));
}

export function getActivity(scanId: string) {
  return request<ActivityEvent[]>(() => api.get(`/activity/${scanId}`));
}

export function getSettings() {
  return request<SettingsStatus>(() => api.get("/settings"));
}
