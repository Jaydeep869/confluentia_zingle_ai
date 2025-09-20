import { NextRequest } from "next/server";
import { getSchema, sqliteQuery, ensureSqlite } from "@/lib/db";
import {
  generateSQLFromQuestion,
  validateSQL,
  explainSQL,
  generatePythonFromSQL,
} from "@/lib/llm";

export async function POST(req: NextRequest) {
  try {
    const { datasetId, question } = await req.json();
    if (!datasetId || !question) {
      return Response.json(
        { error: "datasetId and question are required" },
        { status: 400 }
      );
    }

    // Ensure SQLite is available and build a targeted schema for the dataset table
    await ensureSqlite();
    let schema = await getSchema();
    if (Array.isArray(schema)) {
      schema = schema.filter((c: any) => c.table_name === datasetId);
      // If schema is empty (new table), try PRAGMA to fetch columns
      if (!schema.length) {
        try {
          const cols = await sqliteQuery(`PRAGMA table_info(${datasetId})`);
          schema = cols.map((c: any) => ({
            table_name: datasetId,
            column_name: c.name,
            data_type: c.type || "TEXT",
            is_nullable: c.notnull === 0 ? "YES" : "NO",
          }));
        } catch {}
      }
    }

    const gen = await generateSQLFromQuestion(question, schema, "sqlite");
    if (!gen.sql) {
      return Response.json(
        { error: gen.error || "Failed to generate SQL" },
        { status: 200 }
      );
    }

    // Validate SQL for safety
    const safety = validateSQL(gen.sql);
    if (!safety.valid) {
      return Response.json(
        { error: safety.error, sql: gen.sql },
        { status: 200 }
      );
    }

    // Try execution
    let rows: any[] = [];
    try {
      rows = await sqliteQuery(gen.sql);
    } catch (e: any) {
      // Ignore execution failure; still return SQL and Python
    }

    // Try to generate a Python helper script using Gemini
    let python = "";
    try {
      if (process.env.GOOGLE_API_KEY) {
        python = await generatePythonFromSQL(datasetId, gen.sql);
      }
    } catch (e) {
      // ignored
    }

    if (!python) {
      python = [
        "# Auto-generated Python script",
        "import sqlite3",
        "import pandas as pd",
        "",
        "conn = sqlite3.connect('ai_copilot.db')",
        `sql = """${gen.sql.replace(/"""/g, '"""')}"""`,
        "df = pd.read_sql_query(sql, conn)",
        "print(df.head(10))",
        "",
      ].join("\n");
    }

    return Response.json({
      datasetId,
      tableName: datasetId,
      question,
      sql: gen.sql,
      python,
      explanation: gen.explanation || (await explainSQL(gen.sql)),
      preview: rows.slice(0, 5),
    });
  } catch (err: any) {
    return Response.json(
      { error: err?.message || "CSV ask failed" },
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
