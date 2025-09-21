import { NextRequest, NextResponse } from "next/server";
import { createTableFromHeaders, bulkInsert, sqliteQuery } from "@/lib/db";
import { UploadColumnSummary, UploadResponse, SqlRow } from "@/lib/types";

function detectType(val: string): string {
  if (val === "" || val == null) return "string";
  if (!isNaN(Number(val))) return Number.isInteger(Number(val)) ? "integer" : "float";
  const d = new Date(val);
  if (!isNaN(d.getTime())) return "date";
  return "string";
}

interface UploadRequestBody {
  filename: string;
  content: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: UploadRequestBody = await req.json();
    const { filename, content } = body;

    if (!content) return NextResponse.json({ error: "No CSV content provided" }, { status: 400 });

    const lines = content.split(/\r?\n/).filter(Boolean);
    if (!lines.length) return NextResponse.json({ error: "Empty CSV" }, { status: 400 });

    const headers = lines[0].split(",").map((h) => h.trim());
    const rows: SqlRow[] = lines.slice(1).map((line) => {
      const parts = line.split(",");
      const obj: SqlRow = {};
      headers.forEach((h, i) => (obj[h] = parts[i] ?? ""));
      return obj;
    })

    // Infer column types and sample values
    const columns: UploadColumnSummary[] = headers.map((h) => {
      const samples = rows.slice(0, 5).map((r) => String(r[h] ?? ""));
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

    const analysis = `Detected ${rows.length} rows and ${headers.length} columns. Top columns: ${headers.slice(0, 3).join(", ")}.`;

    // Create table in SQLite
    const tableName = `csv_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
    const sanitizedHeaders = await createTableFromHeaders(tableName, headers);

    // Normalize rows to sanitized headers
    const normalizedRows: SqlRow[] = rows.map((r) => {
      const o: SqlRow = {};
      sanitizedHeaders.forEach((sh, idx) => {
        const original = headers[idx];
        o[sh] = r[original] ?? "";
      });
      return o;
    });

    // Insert rows in batches
    const chunkSize = 200;
    for (let i = 0; i < normalizedRows.length; i += chunkSize) {
      await bulkInsert(tableName, sanitizedHeaders, normalizedRows.slice(i, i + chunkSize));
    }

    const resp: UploadResponse = {
      filename,
      rowCount: rows.length,
      columnCount: headers.length,
      columns,
      analysis,
      sampleData: rows.slice(0, Math.min(5, rows.length)),
      timestamp: new Date().toISOString(),
      datasetId: tableName,
      tableName,
    };

    return NextResponse.json(resp);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
