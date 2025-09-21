import { NextRequest, NextResponse } from "next/server";
import {
  initializeDatabase,
  getSchema as getDbSchema,
  query as dbQuery,
} from "@/lib/db";
import { generateSQLFromQuestion, validateSQL, explainSQL, SchemaColumn } from "@/lib/llm";

let dbInitialized = false;
async function ensureDb() {
  if (!dbInitialized) {
    dbInitialized = await initializeDatabase();
  }
}

interface AskRequestBody {
  question: string;
  generateOnly?: boolean;
}

export async function POST(req: NextRequest) {
  try {
    await ensureDb();
    const body: AskRequestBody = await req.json();
    const { question, generateOnly = false } = body;

    if (!question || typeof question !== "string") {
      return NextResponse.json({ error: "Question is required" }, { status: 400 });
    }

    const schemaRaw = await getDbSchema();
    const schema: SchemaColumn[] = Array.isArray(schemaRaw) ? (schemaRaw as SchemaColumn[]) : [];
    const gen = await generateSQLFromQuestion(question, schema, "postgresql");

    if (gen.error || !gen.sql) {
      return NextResponse.json(
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
      return NextResponse.json({
        question,
        sql: gen.sql,
        explanation,
        executed: false,
        timestamp: new Date().toISOString(),
      });
    }

    const safety = validateSQL(gen.sql);
    if (!safety.valid) {
      return NextResponse.json(
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

    return NextResponse.json({
      question,
      sql: gen.sql,
      explanation,
      executed: true,
      result: rows,
      rowCount: rows.length,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
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
