import axios from "axios";
import type { ActivityEvent, Finding, HealthResponse, ScanRecord } from "../types/security";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000/api",
  timeout: 60_000,
});

export async function getHealth(): Promise<HealthResponse> {
  const { data } = await api.get<HealthResponse>("/health");
  return data;
}

export async function scanRepository(payload: { url: string; branch?: string }): Promise<ScanRecord> {
  const { data } = await api.post<ScanRecord>("/scan", payload);
  return data;
}

export async function uploadRepository(file: File): Promise<ScanRecord> {
  const body = new FormData();
  body.append("file", file);
  const { data } = await api.post<ScanRecord>("/repositories/upload", body);
  return data;
}

export async function getScan(scanId: string): Promise<ScanRecord> {
  const { data } = await api.get<ScanRecord>(`/scans/${scanId}`);
  return data;
}

export async function getFindings(scanId: string): Promise<Finding[]> {
  const { data } = await api.get<Finding[]>(`/scans/${scanId}/findings`);
  return data;
}

export async function getFinding(findingId: string): Promise<Finding> {
  const { data } = await api.get<Finding>(`/findings/${findingId}`);
  return data;
}

export async function generateFix(findingId: string): Promise<Finding> {
  const { data } = await api.post<Finding>(`/findings/${findingId}/generate-fix`);
  return data;
}

export async function applyFix(findingId: string): Promise<Finding> {
  const { data } = await api.post<Finding>(`/findings/${findingId}/apply-fix`);
  return data;
}

export async function runTests(findingId: string): Promise<{ passed: number; failed: number }> {
  const { data } = await api.post<{ passed: number; failed: number }>(`/findings/${findingId}/test`);
  return data;
}

export async function verifyFix(findingId: string): Promise<{ verified: boolean; summary: string }> {
  const { data } = await api.post<{ verified: boolean; summary: string }>(`/findings/${findingId}/verify`);
  return data;
}

export async function getActivity(scanId: string): Promise<ActivityEvent[]> {
  const { data } = await api.get<ActivityEvent[]>(`/activity/${scanId}`);
  return data;
}
