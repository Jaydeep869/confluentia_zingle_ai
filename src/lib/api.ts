// /src/lib/api.ts
import { SQLResponse, UploadResponse, CsvAskResponse } from "./types";

const API_BASE = "/api";

export async function askQuestion(
  question: string,
  generateOnly: boolean = false
): Promise<SQLResponse> {
  const response = await fetch(`${API_BASE}/ask`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ question, generateOnly }),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }

  return response.json();
}

export async function uploadFile(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE}/upload`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }

  return response.json();
}

export interface SchemaSummary { schema: unknown; tableCount: number; columnCount: number; timestamp: string; error?: string }
export async function getSchema(): Promise<SchemaSummary> {
  const response = await fetch(`${API_BASE}/schema`);

  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }

  return response.json() as Promise<SchemaSummary>;
}

export async function askCsvQuestion(datasetId: string, question: string): Promise<CsvAskResponse> {
  const response = await fetch(`${API_BASE}/csv/ask`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ datasetId, question }),
  });
  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }
  return response.json() as Promise<CsvAskResponse>;
}
