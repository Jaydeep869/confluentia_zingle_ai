// /src/lib/db.ts
import { Pool } from "pg";
import sqlite3 from "sqlite3";
import { open, Database } from "sqlite";
import { SqlRow } from "./types";

// ---------------------
// PostgreSQL (Neon) setup
// ---------------------
const connectionString =
  process.env.DB_URL || "postgresql://localhost:5432/postgres";

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
});

// ---------------------
// SQLite fallback
// ---------------------
let sqliteDb: Database<sqlite3.Database, sqlite3.Statement> | null = null;

export async function ensureSqlite(): Promise<
  Database<sqlite3.Database, sqlite3.Statement>
> {
  if (!sqliteDb) {
    sqliteDb = await open({
      filename: "./ai_copilot.db",
      driver: sqlite3.Database,
    });
  }
  return sqliteDb;
}

// ---------------------
// Initialize DB
// ---------------------
export async function initializeDatabase(): Promise<boolean> {
  try {
    // Try PostgreSQL first
    await pool.query("SELECT NOW()");
    console.log("Connected to Neon PostgreSQL database");

    // Ensure sample table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'sample_data'
      )
    `);

    if (!tableCheck.rows[0].exists) {
      await pool.query(`
        CREATE TABLE sample_data (
          id SERIAL PRIMARY KEY,
          name TEXT,
          value INTEGER,
          category TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await pool.query(`
        INSERT INTO sample_data (name, value, category) VALUES
        ('Item 1', 100, 'A'),
        ('Item 2', 200, 'B'),
        ('Item 3', 150, 'A'),
        ('Item 4', 300, 'C'),
        ('Item 5', 250, 'B')
      `);

      console.log("Created sample table with data in Neon PostgreSQL");
    }

    return true;
  } catch (error) {
    console.log("Neon PostgreSQL connection failed, using SQLite...", error);

    try {
      const db = await ensureSqlite();

      await db.exec(`
        CREATE TABLE IF NOT EXISTS sample_data (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT,
          value INTEGER,
          category TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      const sampleCount = await db.get<{ count: number }>(
        "SELECT COUNT(*) as count FROM sample_data"
      );
      if (!sampleCount || sampleCount.count === 0) {
        await db.exec(`
          INSERT INTO sample_data (name, value, category) VALUES
          ('Item 1', 100, 'A'),
          ('Item 2', 200, 'B'),
          ('Item 3', 150, 'A'),
          ('Item 4', 300, 'C'),
          ('Item 5', 250, 'B')
        `);
      }

      console.log("Connected to SQLite database with sample data");
      return true;
    } catch (sqliteError) {
      console.error(
        "Failed to connect to both Neon PostgreSQL and SQLite:",
        sqliteError
      );
      return false;
    }
  }
}

// ---------------------
// Unified query function
// ---------------------
export async function query(sql: string, params: unknown[] = []) {
  try {
    const result = await pool.query(sql, params);
    return result.rows;
  } catch (error) {
    console.log("PostgreSQL query failed, using SQLite...");

    const db = await ensureSqlite();
    try {
      return db.all(sql, params);
    } catch (sqliteError) {
      console.error("SQLite query failed:", sqliteError);
      throw new Error(`Database query failed: ${sqliteError}`);
    }
  }
}

// ---------------------
// Get DB schema
// ---------------------
export interface SchemaColumn {
  table_name: string;
  column_name: string;
  data_type: string;
  is_nullable: string;
}

export async function getSchema(): Promise<SchemaColumn[]> {
  try {
    const result = await pool.query(`
      SELECT table_name, column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
      ORDER BY table_name, ordinal_position
    `);
    return result.rows;
  } catch {
    // Fallback to SQLite
    const db = await ensureSqlite();
    const tables: Array<{ table_name: string }> = await db.all(
      "SELECT name as table_name FROM sqlite_master WHERE type='table'"
    );

    const schema: SchemaColumn[] = [];
    for (const table of tables) {
      const cols = await db.all(
        `PRAGMA table_info(${table.table_name})`
      );
      for (const col of cols) {
        schema.push({
          table_name: table.table_name,
          column_name: col.name,
          data_type: col.type,
          is_nullable: col.notnull === 0 ? "YES" : "NO",
        });
      }
    }
    return schema;
  }
}

// ---------------------
// CSV helpers (SQLite only)
// ---------------------
export async function createTableFromHeaders(
  tableName: string,
  headers: string[]
) {
  const cols = headers
    .map((h) => h.replace(/[^a-zA-Z0-9_]/g, "_"))
    .map((h) => (h ? h : "col"));
  const ddl = `CREATE TABLE IF NOT EXISTS ${tableName} (${cols
    .map((c) => `"${c}" TEXT`)
    .join(", ")})`;
  const db = await ensureSqlite();
  await db.exec(ddl);
  return cols;
}

export async function bulkInsert(
  tableName: string,
  headers: string[],
  rows: SqlRow[]
) {
  const cols = headers
    .map((h) => h.replace(/[^a-zA-Z0-9_]/g, "_"))
    .map((h) => (h ? h : "col"));
  const db = await ensureSqlite();
  const stmt = await db.prepare(
    `INSERT INTO ${tableName} (${cols.map((c) => `"${c}"`).join(",")}) VALUES (${cols
      .map(() => "?")
      .join(",")})`
  );
  try {
    await db.exec("BEGIN");
    for (const r of rows) {
      await stmt.run(...cols.map((c) => r[c] ?? ""));
    }
    await db.exec("COMMIT");
  } catch (e) {
    await db.exec("ROLLBACK");
    throw e;
  } finally {
    await stmt.finalize();
  }
}

export async function sqliteQuery(sql: string, params: unknown[] = []) {
  const db = await ensureSqlite();
  return db.all(sql, params);
}
