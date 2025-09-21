// /tests/test-db.ts
import { initializeDatabase, getSchema, query } from "../lib/db";

async function testDatabase(): Promise<void> {
  console.log("Testing database connection...");

  const connected = await initializeDatabase();
  if (connected) {
    console.log("Database connection successful!");

    // Test schema retrieval
    try {
      const schema = await getSchema();
      console.log("Database schema:", schema);

      // Test a simple query
      const result = await query("SELECT * FROM sample_data");
      console.log("Sample data:", result);
    } catch (error: unknown) {
      console.error("Failed to retrieve data:", error);
    }
  } else {
    console.error("Database connection failed");
  }
}

testDatabase();
