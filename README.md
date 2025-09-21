<div align="center">

# Confluentia Zingle AI — AI Copilot for Data Teams

Ask questions in plain English, get safe SQL back, run quick analyses on your database or uploaded CSVs, and even auto-generate a Python script for reproducible analysis.

</div>

## What it does

- Natural language ➜ SQL using Google Gemini (via LangChain)
- Safe-by-default query execution (SELECT-only, basic safety checks)
- Connects to Neon.tech Postgres (preferred). Falls back to a local SQLite file for demos and CSV datasets
- CSV upload and profiling: infer columns/types, import to SQLite, ask questions about your dataset, preview results
- One-click Python script generation for your generated SQL (sqlite3 + pandas)

Built with Next.js App Router, React 19, and Tailwind CSS 4.

## Tech stack

- Frontend: Next.js 15, React 19, Tailwind CSS 4
- AI: @langchain/google-genai (Gemini 1.5 Flash)
- Databases: PostgreSQL (Neon) + SQLite (fallback and CSV workspace)
- Server: Next.js route handlers (app/api)

## Quick start

1. Install dependencies

```bash
npm install
```

2. Create `.env.local` in the project root

```bash
# Primary DB (Neon Postgres). Requires sslmode=require
DB_URL=postgresql://<user>:<password>@<host>/<database>?sslmode=require

# Enable NL→SQL with Gemini
GOOGLE_API_KEY=your_google_api_key
```

Notes

- If `DB_URL` is missing or unreachable, the app will fall back to a local SQLite file `ai_copilot.db` in the repo root (great for demos and all CSV workflows).
- Gemini is optional but strongly recommended for NL→SQL. Without `GOOGLE_API_KEY`, the app still runs but cannot generate SQL automatically.

3. Start the dev server

```bash
npm run dev
```

Open http://localhost:3000

## Product walkthrough

- Home: Landing page with a link out to features.
- Analyse (CSV): Upload a `.csv`, see inferred schema and sample data, then ask questions in natural language. The app:
  - Creates a SQLite table named like `csv_<id>` in `ai_copilot.db`
  - Generates a SQLite-flavored SQL query with Gemini
  - Executes the query (SELECT-only), shows a small preview
  - Auto-generates a short Python script (sqlite3 + pandas) that you can copy
- Ask (DB): Ask your database questions. The app generates Postgres SQL and (if safety checks pass) can be executed. In the default UI the “generate only” flow is used to show SQL and an explanation.

## Environment variables

Minimum you’ll want:

- DB_URL — your Neon Postgres connection string (sslmode=require)
- GOOGLE_API_KEY — Google Generative AI API key for Gemini

Example Neon connection string

```
postgresql://<user>:<password>@<project>-<hash>.eu-central-1.aws.neon.tech/<db>?sslmode=require
```

## Scripts

- dev — run the Next.js dev server (Turbopack)
- build — build for production (Turbopack)
- start — start the production server
- lint — run ESLint

## API reference

All routes are under `/api` and return JSON.

1. POST `/api/ask` — Natural language to Postgres SQL

Request body

```json
{ "question": "Top 10 customers by revenue", "generateOnly": true }
```

Response (subset)

```json
{
  "question": "Top 10 customers by revenue",
  "sql": "SELECT ...",
  "explanation": "...",
  "executed": false,
  "error": null,
  "timestamp": "2025-09-21T12:34:56.000Z"
}
```

2. GET `/api/schema` — Introspect database schema

Response (subset)

```json
{
  "schema": [
    {
      "table_name": "sample_data",
      "column_name": "id",
      "data_type": "integer",
      "is_nullable": "NO"
    }
  ],
  "tableCount": 1,
  "columnCount": 5
}
```

3. POST `/api/upload` — Upload a CSV (multipart/form-data)

Form field

- `file` — the CSV file to upload

Response (subset)

```json
{
  "filename": "data.csv",
  "rowCount": 1234,
  "columnCount": 12,
  "columns": [{ "name": "col1", "type": "string", "sampleValues": ["a", "b"] }],
  "datasetId": "csv_k3l2...",
  "tableName": "csv_k3l2...",
  "timestamp": "2025-09-21T12:34:56.000Z"
}
```

4. POST `/api/csv/ask` — Ask questions about an uploaded CSV (SQLite dialect)

Request body

```json
{ "datasetId": "csv_k3l2...", "question": "Average order amount by country" }
```

Response (subset)

```json
{
  "datasetId": "csv_k3l2...",
  "sql": "SELECT ...",
  "python": "# Auto-generated Python script...",
  "preview": [{ "country": "US", "avg_amount": 123.45 }],
  "explanation": "..."
}
```

## DEMO



https://github.com/user-attachments/assets/f7d183fb-a0d5-4116-9790-2e5ab60e2cc5


## Architecture map

- `src/lib/db.ts` — Postgres (Neon) client with SSL + SQLite fallback. Helpers for CSV table creation and inserts
- `src/lib/llm.ts` — Gemini prompts: generate SQL (Postgres/SQLite), validate SQL (SELECT-only), explain SQL, generate Python
- `src/app/api/*` — Next.js route handlers: `ask`, `schema`, `upload`, `csv/ask`
- `src/app/analyse/page.tsx` — CSV upload + Q&A UI
- `src/app/page.tsx` — Landing page

## Safety considerations

- Only SELECT queries are allowed by the validator; potentially destructive statements are blocked
- Generated SQL can include literals; prefer reviewing SQL before execution in production
- Do not expose these endpoints publicly without authentication and rate-limiting

## Deployment notes

- The CSV workflow stores data in a local SQLite file: `ai_copilot.db`
  - In serverless environments (e.g., Vercel), the filesystem is ephemeral; SQLite won’t persist across deployments/instances
  - For production CSV analytics, consider importing into Postgres (Neon) or another managed store
- Set `DB_URL` in your host’s environment variables; ensure SSL is enabled
- Set `GOOGLE_API_KEY` to enable NL→SQL and explanations

## Troubleshooting

- “Google API key is not configured” — set `GOOGLE_API_KEY` and restart the dev server
- “Neon connection failed, trying SQLite…” — check `DB_URL`; the app will keep working using `ai_copilot.db`
- CSV import succeeded but queries fail — ensure the SQL dialect matches (CSV uses SQLite dialect); ask through `/api/csv/ask` or the Analyse page

## Roadmap ideas

- Auth + role-based access
- Parameterized query execution and result caching
- Streamed results and larger CSV ingestion
- Bring-your-own model/provider abstraction

## License

No license specified yet.
