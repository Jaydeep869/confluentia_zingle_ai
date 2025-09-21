// /src/app/api/schema/route.ts
import { initializeDatabase, getSchema } from "@/lib/db";

let ready = false;
async function ensureDb() {
  if (!ready) {
    ready = await initializeDatabase();
  }
}

export async function GET() {
  try {
    await ensureDb();
    const schema = await getSchema();
    if (!schema || schema.length === 0) {
      return Response.json(
        { error: "No database schema available" },
        { status: 500 }
      );
    }
    const tableNames = Array.isArray(schema)
      ? schema
          .map((c) => (c && typeof c === 'object' && 'table_name' in c ? (c as { table_name?: unknown }).table_name : undefined))
          .filter((t): t is string => typeof t === 'string')
      : [];
    return Response.json({
      schema,
      tableCount: new Set(tableNames).size,
      columnCount: Array.isArray(schema) ? schema.length : 0,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to retrieve schema';
    return Response.json(
      { error: message },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
