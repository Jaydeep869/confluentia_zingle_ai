import { Pool } from "pg";

// Parse your Neon.tech connection URL
const connectionString =
  process.env.DB_URL || "postgresql://localhost:5432/postgres";
// Database connection configuration for Neon.tech
const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
});

// For demo purposes, we'll also set up a simple SQLite database as a fallback
import sqlite3 from "sqlite3";
import { open } from "sqlite";

let sqliteDb: any = null;

// Initialize the database
async function initializeDatabase() {
  try {
    // Try to connect to Neon PostgreSQL first
    await pool.query("SELECT NOW()");
    console.log("Connected to Neon PostgreSQL database");

    // Check if we have the sample table, create if not
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

      // Insert some sample data
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
    console.log("Neon PostgreSQL connection failed, trying SQLite...", error);

    // Fallback to SQLite for demo purposes
    try {
      sqliteDb = await open({
        filename: "./ai_copilot.db",
        driver: sqlite3.Database,
      });

      // Create a sample table if it doesn't exist
      await sqliteDb.exec(`
        CREATE TABLE IF NOT EXISTS sample_data (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT,
          value INTEGER,
          category TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Insert some sample data
      const sampleCount = await sqliteDb.get(
        "SELECT COUNT(*) as count FROM sample_data"
      );
      if (sampleCount.count === 0) {
        await sqliteDb.exec(`
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

// Query function that works with either database
async function query(sql: string, params: any[] = []) {
  try {
    // Try PostgreSQL first
    const result = await pool.query(sql, params);
    return result.rows;
  } catch (error) {
    console.log("PostgreSQL query failed, trying SQLite...");

    // Fallback to SQLite
    if (sqliteDb) {
      try {
        const result = await sqliteDb.all(sql, params);
        return result;
      } catch (sqliteError) {
        console.error("SQLite query failed:", sqliteError);
        throw new Error(`Database query failed: ${sqliteError}`);
      }
    } else {
      throw new Error("No database connection available");
    }
  }
}

// Get database schema information
async function getSchema() {
  try {
    // Try PostgreSQL schema query
    const tablesQuery = `
      SELECT table_name, column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
      ORDER BY table_name, ordinal_position
    `;
    const result = await pool.query(tablesQuery);
    return result.rows;
  } catch (error) {
    console.log("PostgreSQL schema query failed, trying SQLite...");

    // Fallback to SQLite schema query
    if (sqliteDb) {
      try {
        const tablesQuery = `
          SELECT name as table_name
          FROM sqlite_master
          WHERE type='table'
        `;
        const tables = await sqliteDb.all(tablesQuery);

        let schema: any[] = [];
        for (const table of tables) {
          const tableInfo = await sqliteDb.all(
            `PRAGMA table_info(${table.table_name})`
          );
          for (const column of tableInfo) {
            schema.push({
              table_name: table.table_name,
              column_name: column.name,
              data_type: column.type,
              is_nullable: column.notnull === 0 ? "YES" : "NO",
            });
          }
        }
        return schema;
      } catch (sqliteError) {
        console.error("SQLite schema query failed:", sqliteError);
        throw new Error(`Schema query failed: ${sqliteError}`);
      }
    } else {
      throw new Error("No database connection available");
    }
  }
}

export { initializeDatabase, query, getSchema };
