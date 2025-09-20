// /src/lib/api.ts
import { SQLResponse, UploadResponse } from "./types";

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

export async function getSchema(): Promise<any> {
  const response = await fetch(`${API_BASE}/schema`);

  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }

  return response.json();
}
