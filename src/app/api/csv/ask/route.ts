// /src/app/api/ask-csv/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSchema, sqliteQuery, ensureSqlite } from "@/lib/db";
import {
  generateSQLFromQuestion,
  validateSQL,
  explainSQL,
  generatePythonFromSQL,
} from "@/lib/llm";

interface CsvAskRequestBody {
  datasetId: string; // <-- dynamic table name
  question: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: CsvAskRequestBody = await req.json();
    const { datasetId, question } = body;

    if (!datasetId || !question) {
      return NextResponse.json(
        { error: "datasetId and question are required" },
        { status: 400 }
      );
    }

    // Ensure SQLite is ready
    await ensureSqlite();

    type SchemaColumn = {
      table_name: string;
      column_name: string;
      data_type: string;
      is_nullable: string;
    };

    const schemaUnknown: unknown = await getSchema();
    let schema: SchemaColumn[] = Array.isArray(schemaUnknown)
      ? (schemaUnknown as SchemaColumn[])
      : [];

    // Filter schema for this dataset/table
    schema = schema.filter((c) => c.table_name === datasetId);

    // If schema empty, fallback to PRAGMA
    if (!schema.length) {
      try {
        const cols: Array<{ name: string; type: string; notnull: number }> =
          await sqliteQuery(`PRAGMA table_info(${datasetId})`);
        schema = cols.map((c) => ({
          table_name: datasetId,
          column_name: c.name,
          data_type: c.type || "TEXT",
          is_nullable: c.notnull === 0 ? "YES" : "NO",
        }));
      } catch {
        return NextResponse.json(
          { error: "No dataset found. Please upload a CSV first." },
          { status: 400 }
        );
      }
    }

    const gen = await generateSQLFromQuestion(question, schema, "sqlite");

    if (!gen.sql) {
      return NextResponse.json(
        { error: gen.error || "Failed to generate SQL" },
        { status: 200 }
      );
    }

    // Validate SQL
    const safety = validateSQL(gen.sql);
    if (!safety.valid) {
      return NextResponse.json(
        { error: safety.error, sql: gen.sql },
        { status: 200 }
      );
    }

    // Execute SQL safely
    let rows: Array<Record<string, unknown>> = [];
    try {
      rows = await sqliteQuery(gen.sql);
    } catch (err) {
      return NextResponse.json(
        { error: "SQL execution failed: " + (err instanceof Error ? err.message : err) },
        { status: 200 }
      );
    }

    // Generate Python script
    let python = "";
    try {
      if (process.env.GOOGLE_API_KEY) {
        python = await generatePythonFromSQL(datasetId, gen.sql);
      }
    } catch {
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

    return NextResponse.json({
      tableName: datasetId,
      question,
      sql: gen.sql,
      python,
      explanation: gen.explanation || (await explainSQL(gen.sql)),
      preview: rows.slice(0, 5),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "CSV ask failed";
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
