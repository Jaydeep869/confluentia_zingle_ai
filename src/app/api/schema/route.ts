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
    return Response.json({
      schema,
      tableCount: new Set(schema.map((c: any) => c.table_name)).size,
      columnCount: schema.length,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return Response.json(
      { error: err?.message || "Failed to retrieve schema" },
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
