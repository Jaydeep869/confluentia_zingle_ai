// /src/app/api/upload/route.ts
import { NextRequest } from "next/server";
import { UploadColumnSummary, UploadResponse } from "@/lib/types";
import { createTableFromHeaders, bulkInsert } from "@/lib/db";

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

    // Import into database table so user can query later
    const tableName = `csv_${Date.now().toString(36)}_${Math.random()
      .toString(36)
      .slice(2, 7)}`;
    const sanitizedHeaders = await createTableFromHeaders(tableName, headers);
    // Normalize rows to sanitized headers
    const normalizedRows = rows.map((r) => {
      const o: Record<string, any> = {};
      sanitizedHeaders.forEach((sh, idx) => {
        const original = headers[idx];
        o[sh] = r[original] ?? "";
      });
      return o;
    });
    // Insert in batches
    const chunkSize = 200;
    for (let i = 0; i < normalizedRows.length; i += chunkSize) {
      await bulkInsert(
        tableName,
        sanitizedHeaders,
        normalizedRows.slice(i, i + chunkSize)
      );
    }

    const resp: UploadResponse = {
      filename: (file as File).name,
      rowCount: rows.length,
      columnCount: headers.length,
      columns,
      analysis,
      sampleData: rows.slice(0, Math.min(5, rows.length)),
      timestamp: new Date().toISOString(),
      datasetId: tableName,
      tableName,
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
