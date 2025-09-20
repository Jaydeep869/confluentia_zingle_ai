// /src/app/api/ask/route.ts
import { NextRequest } from "next/server";
import {
  initializeDatabase,
  getSchema as getDbSchema,
  query as dbQuery,
} from "@/lib/db";
import { generateSQLFromQuestion, validateSQL, explainSQL } from "@/lib/llm";

let dbInitialized = false;
async function ensureDb() {
  if (!dbInitialized) {
    dbInitialized = await initializeDatabase();
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureDb();
    const { question, generateOnly = false } = await req.json();
    if (!question || typeof question !== "string") {
      return Response.json({ error: "Question is required" }, { status: 400 });
    }

    const schema = await getDbSchema();
    const gen = await generateSQLFromQuestion(question, schema, "postgresql");
    if (gen.error || !gen.sql) {
      return Response.json(
        {
          question,
          sql: "",
          explanation: gen.explanation,
          executed: false,
          error: gen.error,
        },
        { status: 200 }
      );
    }

    if (generateOnly) {
      const explanation = gen.explanation || (await explainSQL(gen.sql));
      return Response.json({
        question,
        sql: gen.sql,
        explanation,
        executed: false,
        timestamp: new Date().toISOString(),
      });
    }

    const safety = validateSQL(gen.sql);
    if (!safety.valid) {
      return Response.json(
        {
          question,
          sql: gen.sql,
          explanation: gen.explanation,
          executed: false,
          error: safety.error,
        },
        { status: 200 }
      );
    }

    const rows = await dbQuery(gen.sql);
    const explanation = gen.explanation || (await explainSQL(gen.sql));
    return Response.json({
      question,
      sql: gen.sql,
      explanation,
      executed: true,
      result: rows,
      rowCount: rows.length,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return Response.json(
      { error: err?.message || "Internal error" },
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
