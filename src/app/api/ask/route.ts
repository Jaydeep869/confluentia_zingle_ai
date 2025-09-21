import { NextRequest, NextResponse } from "next/server";
import {
  getSchema,
  sqliteQuery,
  ensureSqlite,
  SQLITE_FILE_PATH,
} from "@/lib/db";
import {
  generateSQLFromQuestion,
  validateSQL,
  explainSQL,
  generatePythonFromSQL,
} from "@/lib/llm";

const FIXED_TABLE = "uploaded_csv";

interface CsvAskRequestBody {
  question: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: CsvAskRequestBody = await req.json();
    const { question } = body;

    if (!question)
      return NextResponse.json(
        { error: "Question is required" },
        { status: 400 }
      );

    // Ensure SQLite is ready
    await ensureSqlite();

    type SchemaColumn = {
      table_name: string;
      column_name: string;
      data_type: string;
      is_nullable: string;
    };
    let schema: SchemaColumn[] = (await getSchema()).filter(
      (c) => c.table_name === FIXED_TABLE
    );

    if (!schema.length) {
      // fallback to PRAGMA
      try {
        const cols: Array<{ name: string; type: string; notnull: number }> =
          await sqliteQuery(`PRAGMA table_info(${FIXED_TABLE})`);
        schema = cols.map((c) => ({
          table_name: FIXED_TABLE,
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

    if (!gen.sql)
      return NextResponse.json(
        { error: gen.error || "Failed to generate SQL" },
        { status: 200 }
      );

    const safety = validateSQL(gen.sql);
    if (!safety.valid)
      return NextResponse.json(
        { error: safety.error, sql: gen.sql },
        { status: 200 }
      );

    let rows: Array<Record<string, unknown>> = [];
    try {
      rows = await sqliteQuery(gen.sql);
    } catch {
      /* ignore */
    }

    let python = "";
    try {
      python = process.env.GOOGLE_API_KEY
        ? await generatePythonFromSQL(FIXED_TABLE, gen.sql)
        : "";
    } catch {
      /* ignore */
    }

    if (!python) {
      python = [
        "# Auto-generated Python script",
        "import sqlite3",
        "import pandas as pd",
        "",
        `conn = sqlite3.connect('${SQLITE_FILE_PATH.replace(
          /\\/g,
          "\\\\"
        ).replace(/'/g, "\\'")}')`,
        `sql = """${gen.sql.replace(/"""/g, '"""')}"""`,
        "df = pd.read_sql_query(sql, conn)",
        "print(df.head(10))",
        "",
      ].join("\n");
    }

    return NextResponse.json({
      tableName: FIXED_TABLE,
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
