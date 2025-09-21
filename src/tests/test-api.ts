import { POST } from "../app/api/ask/route";
import type { NextRequest } from "next/server";

// Minimal cookie jar stub matching methods used by NextRequest (none used here)
interface CookieStoreStub {
  get: (name: string) => undefined;
  getAll: () => [];
  set: (name: string, value: string) => void;
  delete: (name: string) => void;
}

const cookieStoreStub: CookieStoreStub = {
  get: () => undefined,
  getAll: () => [],
  set: () => {},
  delete: () => {},
};

// Mock the request and test our handler
async function testAPI(): Promise<void> {
  console.log("Testing API endpoint...");

  // Create a minimal NextRequest-compatible stub implementing required shape used by handler
  const mockRequest: NextRequest = {
    // Only json() is used by our POST handler
    json: async () => ({
      question: "Show me all users",
      generateOnly: true,
    }),
    // Unused properties below – provide minimal placeholders
  cookies: cookieStoreStub as unknown as NextRequest["cookies"],
    headers: new Headers(),
    method: "POST",
    url: "http://localhost/test",
  nextUrl: new URL("http://localhost/test") as unknown as NextRequest["nextUrl"],
    bodyUsed: false,
    cache: "no-store",
    credentials: "same-origin",
    destination: "",
    integrity: "",
    keepalive: false,
    mode: "cors",
    redirect: "follow",
    referrer: "",
    referrerPolicy: "no-referrer",
    signal: new AbortController().signal,
  clone() { return this as unknown as NextRequest; },
    arrayBuffer: async () => new ArrayBuffer(0),
    blob: async () => new Blob(),
    formData: async () => new FormData(),
    text: async () => "",
  } as unknown as NextRequest;

  try {
  const response = await POST(mockRequest);

    const data = await response.json();
    console.log("API Response:", data);

    if (data.error) {
      console.error("API Error:", data.error);
    } else {
      console.log("✅ API test successful!");
      console.log("Generated SQL:", data.sql);
      console.log("Explanation:", data.explanation);
    }
  } catch (error: unknown) {
    console.error("API test failed:", error);
  }
}

testAPI();
