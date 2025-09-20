// /src/app/page.tsx
"use client";

import { useState } from "react";
import { askQuestion, uploadFile, askCsvQuestion } from "@/lib/api";
import { SQLResponse, UploadResponse } from "@/lib/types";

export default function Home() {
  const [question, setQuestion] = useState("");
  const [response, setResponse] = useState<SQLResponse | null>(null);
  const [uploadResponse, setUploadResponse] = useState<UploadResponse | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("ask");
  const [file, setFile] = useState<File | null>(null);

  // New state for CSV Q&A
  const [csvQuestion, setCsvQuestion] = useState("");
  const [csvAnswer, setCsvAnswer] = useState<{
    sql?: string;
    python?: string;
    explanation?: string;
    error?: string;
    preview?: any[];
  } | null>(null);
  const [csvLoading, setCsvLoading] = useState(false);

  const handleAskQuestion = async () => {
    if (!question.trim()) return;

    setLoading(true);
    setResponse(null);

    try {
      const result = await askQuestion(question, true);
      setResponse(result);
    } catch (error) {
      console.error("Error asking question:", error);
      setResponse({
        question,
        sql: "",
        explanation: "Failed to generate SQL. Please try again.",
        error: error instanceof Error ? error.message : "Unknown error",
        executed: false,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async () => {
    if (!file) return;

    setLoading(true);
    setUploadResponse(null);

    try {
      const result = await uploadFile(file);
      setUploadResponse(result);
    } catch (error) {
      console.error("Error uploading file:", error);
      setUploadResponse({
        filename: file.name,
        rowCount: 0,
        columnCount: 0,
        columns: [],
        analysis: "Failed to analyze file. Please try again.",
        sampleData: [],
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCsvAsk = async () => {
    if (!uploadResponse?.datasetId || !csvQuestion.trim()) return;

    setCsvLoading(true);
    setCsvAnswer(null);

    try {
      const result = await askCsvQuestion(
        uploadResponse.datasetId,
        csvQuestion
      );
      setCsvAnswer(result);
    } catch (e: any) {
      setCsvAnswer({ error: e?.message || "Failed to ask dataset question" });
    } finally {
      setCsvLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-black via-zinc-900 to-black text-zinc-100">
      {/* subtle grid / glow background layer */}
      <div className="pointer-events-none fixed inset-0 -z-10 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,.04)_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-14">
        <header className="text-center mb-10">
          <h1 className="text-5xl font-semibold tracking-tight mb-3 bg-clip-text text-transparent bg-gradient-to-b from-white to-zinc-400">
            AI Copilot for Data Teams
          </h1>
          <p className="text-base text-zinc-300/80">
            Translate questions to SQL and get instant insights.
            Privacy-friendly. Effortless.
          </p>
        </header>

        {/* Tab Navigation */}
        <div className="flex border-b border-white/10 mb-8 backdrop-blur">
          <button
            className={`py-3 px-6 font-medium text-sm transition-colors ${
              activeTab === "ask"
                ? "border-b-2 border-white text-white"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
            onClick={() => setActiveTab("ask")}
          >
            Ask Questions
          </button>
          <button
            className={`py-3 px-6 font-medium text-sm transition-colors ${
              activeTab === "upload"
                ? "border-b-2 border-white text-white"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
            onClick={() => setActiveTab("upload")}
          >
            Analyze Data
          </button>
        </div>

        {/* Ask Questions Tab */}
        {activeTab === "ask" && (
          <div className="rounded-2xl p-6 mb-8 border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_10px_30px_-10px_rgba(0,0,0,0.6)]">
            <h2 className="text-xl font-semibold mb-4">
              Ask a Question in Natural Language
            </h2>

            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="e.g., Show me the top 5 customers by total purchases"
                className="flex-1 px-4 py-3 rounded-xl bg-black/30 border border-white/10 text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-white/20"
                onKeyDown={(e) => e.key === "Enter" && handleAskQuestion()}
              />
              <button
                onClick={handleAskQuestion}
                disabled={loading || !question.trim()}
                className="px-6 py-3 rounded-xl bg-white text-black font-medium hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {loading ? "Generating..." : "Ask"}
              </button>
            </div>

            {response && (
              <div className="mt-6 p-4 rounded-xl border border-white/10 bg-black/30">
                <h3 className="font-semibold mb-2">Question:</h3>
                <p className="mb-4 text-zinc-300">{response.question}</p>

                {response.sql && (
                  <>
                    <h3 className="font-semibold mb-2">Generated SQL:</h3>
                    <pre className="p-4 rounded-lg overflow-x-auto mb-4 bg-gradient-to-b from-black/50 to-black/30 text-green-300 border border-white/10">
                      {response.sql}
                    </pre>
                  </>
                )}

                {response.explanation && (
                  <>
                    <h3 className="font-semibold mb-2">Explanation:</h3>
                    <p className="text-zinc-300 mb-4">{response.explanation}</p>
                  </>
                )}

                {response.error && (
                  <div className="rounded-lg p-4 mb-4 border border-red-500/30 bg-red-500/10 text-red-200">
                    <h3 className="font-semibold mb-2">Error</h3>
                    <p className="whitespace-pre-line">{response.error}</p>
                    <p className="text-xs mt-2 text-red-300/80">
                      Tip: Set OPENAI_API_KEY in your environment. For rate
                      limits (429), wait a bit or check your plan.
                    </p>
                  </div>
                )}

                {response.result && response.executed && (
                  <>
                    <h3 className="font-semibold mb-2">
                      Results ({response.rowCount} rows):
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full bg-black/20 border border-white/10 rounded-md">
                        <thead>
                          <tr>
                            {response.result.length > 0 &&
                              Object.keys(response.result[0]).map((key) => (
                                <th
                                  key={key}
                                  className="px-4 py-2 border-b border-white/10 bg-white/5 text-left text-xs font-medium text-zinc-300 uppercase"
                                >
                                  {key}
                                </th>
                              ))}
                          </tr>
                        </thead>
                        <tbody>
                          {response.result.slice(0, 5).map((row, index) => (
                            <tr key={index}>
                              {Object.values(row).map((value: any, i) => (
                                <td
                                  key={i}
                                  className="px-4 py-2 border-b border-white/10 text-zinc-200"
                                >
                                  {typeof value === "object"
                                    ? JSON.stringify(value)
                                    : String(value)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {typeof response.rowCount === "number" &&
                        response.rowCount > 5 && (
                          <p className="text-sm text-zinc-400 mt-2">
                            Showing first 5 of {response.rowCount} rows
                          </p>
                        )}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* Analyze Data Tab */}
        {activeTab === "upload" && (
          <div className="rounded-2xl p-6 border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_10px_30px_-10px_rgba(0,0,0,0.6)]">
            <h2 className="text-xl font-semibold mb-4">
              Upload and Analyze Data
            </h2>

            <div className="mb-6">
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Upload CSV File
              </label>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="block w-full text-sm text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border file:border-white/10 file:text-sm file:font-semibold file:bg-white file:text-black hover:file:bg-zinc-100"
              />
              <p className="text-xs text-zinc-400 mt-2">
                Upload a CSV file to get AI-powered analysis and insights
              </p>
            </div>

            <button
              onClick={handleFileUpload}
              disabled={loading || !file}
              className="px-6 py-3 rounded-xl bg-white text-black font-medium hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed mb-6 transition"
            >
              {loading ? "Analyzing..." : "Analyze Data"}
            </button>

            {uploadResponse && (
              <div className="mt-6 p-4 rounded-xl border border-white/10 bg-black/30">
                <h3 className="font-semibold mb-4">
                  Analysis Results for {uploadResponse.filename}
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                    <p className="text-2xl font-bold text-white">
                      {uploadResponse.rowCount}
                    </p>
                    <p className="text-sm text-zinc-400">Total Rows</p>
                  </div>
                  <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                    <p className="text-2xl font-bold text-white">
                      {uploadResponse.columnCount}
                    </p>
                    <p className="text-sm text-zinc-400">Total Columns</p>
                  </div>
                </div>

                {uploadResponse.columns.length > 0 && (
                  <>
                    <h4 className="font-semibold mb-3">Columns:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                      {uploadResponse.columns.map((column, index) => (
                        <div
                          key={index}
                          className="bg-white/5 p-3 rounded-lg border border-white/10"
                        >
                          <p className="font-medium text-white">
                            {column.name}
                          </p>
                          <p className="text-sm text-zinc-400 capitalize">
                            {column.type}
                          </p>
                          {column.sampleValues.length > 0 && (
                            <p className="text-xs text-zinc-500 mt-1">
                              Sample:{" "}
                              {column.sampleValues.slice(0, 3).join(", ")}
                              {column.sampleValues.length > 3 && "..."}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {uploadResponse.analysis && (
                  <>
                    <h4 className="font-semibold mb-3">AI Analysis:</h4>
                    <div className="bg-white/5 p-4 rounded-lg border border-white/10 mb-6">
                      <p className="text-zinc-200 whitespace-pre-wrap">
                        {uploadResponse.analysis}
                      </p>
                    </div>
                  </>
                )}

                {/* CSV Q&A */}
                {uploadResponse.datasetId && (
                  <div className="mt-6">
                    <h4 className="font-semibold mb-3">
                      Ask about this dataset
                    </h4>
                    <div className="flex flex-col sm:flex-row gap-3 mb-4">
                      <input
                        type="text"
                        value={csvQuestion}
                        onChange={(e) => setCsvQuestion(e.target.value)}
                        placeholder={`Ask a question about ${
                          uploadResponse.tableName || "this CSV"
                        } or request a Python script`}
                        className="flex-1 px-4 py-3 rounded-xl bg-black/30 border border-white/10 text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-white/20"
                        onKeyDown={(e) => e.key === "Enter" && handleCsvAsk()}
                      />
                      <button
                        onClick={handleCsvAsk}
                        disabled={csvLoading || !csvQuestion.trim()}
                        className="px-6 py-3 rounded-xl bg-white text-black font-medium hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition"
                      >
                        {csvLoading ? "Thinking..." : "Ask Dataset"}
                      </button>
                    </div>

                    {csvAnswer && (
                      <div className="mt-4 space-y-4">
                        {csvAnswer.sql && (
                          <div>
                            <h5 className="font-semibold mb-2">SQL</h5>
                            <pre className="p-4 rounded-lg overflow-x-auto bg-gradient-to-b from-black/50 to-black/30 text-green-300 border border-white/10">
                              {csvAnswer.sql}
                            </pre>
                          </div>
                        )}
                        {csvAnswer.python && (
                          <div>
                            <h5 className="font-semibold mb-2">
                              Python Script
                            </h5>
                            <pre className="p-4 rounded-lg overflow-x-auto bg-gradient-to-b from-black/50 to-black/30 text-zinc-200 border border-white/10">
                              {csvAnswer.python}
                            </pre>
                          </div>
                        )}
                        {csvAnswer.preview && csvAnswer.preview.length > 0 && (
                          <div>
                            <h5 className="font-semibold mb-2">Preview</h5>
                            <div className="overflow-x-auto">
                              <table className="min-w-full bg-black/20 border border-white/10 rounded-md">
                                <thead>
                                  <tr>
                                    {Object.keys(csvAnswer.preview[0]).map(
                                      (key) => (
                                        <th
                                          key={key}
                                          className="px-3 py-2 border-b border-white/10 bg-white/5 text-left text-xs font-medium text-zinc-300 uppercase"
                                        >
                                          {key}
                                        </th>
                                      )
                                    )}
                                  </tr>
                                </thead>
                                <tbody>
                                  {csvAnswer.preview.map((row, i) => (
                                    <tr key={i}>
                                      {Object.values(row).map((val: any, j) => (
                                        <td
                                          key={j}
                                          className="px-3 py-2 border-b border-white/10 text-sm text-zinc-200"
                                        >
                                          {typeof val === "object"
                                            ? JSON.stringify(val)
                                            : String(val)}
                                        </td>
                                      ))}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                        {csvAnswer.error && (
                          <div className="rounded-lg p-4 border border-red-500/30 bg-red-500/10 text-red-200">
                            <p>{csvAnswer.error}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {uploadResponse.sampleData.length > 0 && (
                  <>
                    <h4 className="font-semibold mb-3">
                      Sample Data (first {uploadResponse.sampleData.length}{" "}
                      rows):
                    </h4>
                    <div className="overflow-x-auto">
                      <table className="min-w-full bg-black/20 border border-white/10 rounded-md">
                        <thead>
                          <tr>
                            {Object.keys(uploadResponse.sampleData[0]).map(
                              (key) => (
                                <th
                                  key={key}
                                  className="px-3 py-2 border-b border-white/10 bg-white/5 text-left text-xs font-medium text-zinc-300 uppercase"
                                >
                                  {key}
                                </th>
                              )
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {uploadResponse.sampleData.map((row, index) => (
                            <tr key={index}>
                              {Object.values(row).map((value: any, i) => (
                                <td
                                  key={i}
                                  className="px-3 py-2 border-b border-white/10 text-sm text-zinc-200"
                                >
                                  {typeof value === "object"
                                    ? JSON.stringify(value)
                                    : String(value)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}

                {uploadResponse.error && (
                  <div className="rounded-lg p-4 mt-4 border border-red-500/30 bg-red-500/10 text-red-200">
                    <h4 className="font-semibold mb-2">Error</h4>
                    <p>{uploadResponse.error}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* SQL Info Panel */}
        <section className="mt-10 rounded-2xl p-6 border border-white/10 bg-white/5 backdrop-blur-xl">
          <h3 className="text-lg font-semibold mb-2">
            About the SQL generator
          </h3>
          <p className="text-zinc-300/90 text-sm">
            This tool converts natural language questions into safe,
            parameterizable SQL. It only executes SELECT queries and blocks
            destructive operations. If generation fails with a quota error
            (429), wait a moment or check your OpenAI plan. To enable
            generation, set the environment variable{" "}
            <span className="font-mono">OPENAI_API_KEY</span> and restart the
            server.
          </p>
        </section>

        {/* Footer */}
        <footer className="text-center mt-12 text-zinc-400 text-sm">
          <p>AI Copilot for Data Teams — Next.js, OpenAI, PostgreSQL</p>
        </footer>
      </div>
    </div>
  );
}
