// /src/app/api/upload/route.ts
import { NextRequest } from "next/server";
import { UploadColumnSummary, UploadResponse } from "@/lib/types";

function detectType(val: string): string {
  if (val === "" || val == null) return "string";
  if (!isNaN(Number(val)))
    return Number.isInteger(Number(val)) ? "integer" : "float";
  const d = new Date(val);
  if (!isNaN(d.getTime())) return "date";
  return "string";
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!file || !(file instanceof File)) {
      return Response.json({ error: "No file provided" }, { status: 400 });
    }

    const text = await file.text();
    const lines = text.split(/\r?\n/).filter(Boolean);
    if (lines.length === 0) {
      return Response.json({ error: "Empty CSV" }, { status: 400 });
    }
    const headers = lines[0].split(",").map((h) => h.trim());
    const rows = lines.slice(1).map((line) => {
      const parts = line.split(",");
      const obj: Record<string, any> = {};
      headers.forEach((h, i) => (obj[h] = parts[i] ?? ""));
      return obj;
    });

    // Infer column info
    const columns: UploadColumnSummary[] = headers.map((h) => {
      const samples = rows.slice(0, 5).map((r) => String(r[h] ?? ""));
      // Determine predominant type from samples
      const types = samples.map(detectType);
      const type = types.includes("string")
        ? "string"
        : types.includes("float")
        ? "float"
        : types.includes("integer")
        ? "integer"
        : types.includes("date")
        ? "date"
        : "string";
      return { name: h, type, sampleValues: samples };
    });

    const analysis = `Detected ${rows.length} rows and ${
      headers.length
    } columns. Top columns: ${headers.slice(0, 3).join(", ")}.`;

    const resp: UploadResponse = {
      filename: file.name,
      rowCount: rows.length,
      columnCount: headers.length,
      columns,
      analysis,
      sampleData: rows.slice(0, Math.min(5, rows.length)),
      timestamp: new Date().toISOString(),
    };
    return Response.json(resp);
  } catch (err: any) {
    return Response.json(
      { error: err?.message || "Upload failed" },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
