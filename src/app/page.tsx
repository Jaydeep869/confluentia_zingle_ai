// /src/app/page.tsx
"use client";

import { useState } from "react";
import { askQuestion, uploadFile } from "@/lib/api";
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            AI Copilot for Data Teams
          </h1>
          <p className="text-lg text-gray-600">
            Transform natural language questions into SQL queries and get
            AI-powered data insights
          </p>
        </header>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 mb-8">
          <button
            className={`py-3 px-6 font-medium text-sm ${
              activeTab === "ask"
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("ask")}
          >
            Ask Questions
          </button>
          <button
            className={`py-3 px-6 font-medium text-sm ${
              activeTab === "upload"
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("upload")}
          >
            Analyze Data
          </button>
        </div>

        {/* Ask Questions Tab */}
        {activeTab === "ask" && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">
              Ask a Question in Natural Language
            </h2>

            <div className="flex gap-4 mb-6">
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="e.g., Show me the top 5 customers by total purchases"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onKeyPress={(e) => e.key === "Enter" && handleAskQuestion()}
              />
              <button
                onClick={handleAskQuestion}
                disabled={loading || !question.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Generating..." : "Ask"}
              </button>
            </div>

            {response && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold mb-2">Question:</h3>
                <p className="mb-4 text-gray-700">{response.question}</p>

                {response.sql && (
                  <>
                    <h3 className="font-semibold mb-2">Generated SQL:</h3>
                    <pre className="bg-gray-800 text-green-400 p-4 rounded-lg overflow-x-auto mb-4">
                      {response.sql}
                    </pre>
                  </>
                )}

                {response.explanation && (
                  <>
                    <h3 className="font-semibold mb-2">Explanation:</h3>
                    <p className="text-gray-700 mb-4">{response.explanation}</p>
                  </>
                )}

                {response.error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                    <h3 className="font-semibold text-red-800 mb-2">Error:</h3>
                    <p className="text-red-600">{response.error}</p>
                  </div>
                )}

                {response.result && response.executed && (
                  <>
                    <h3 className="font-semibold mb-2">
                      Results ({response.rowCount} rows):
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full bg-white border border-gray-200">
                        <thead>
                          <tr>
                            {response.result.length > 0 &&
                              Object.keys(response.result[0]).map((key) => (
                                <th
                                  key={key}
                                  className="px-4 py-2 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase"
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
                                  className="px-4 py-2 border-b border-gray-200"
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
                          <p className="text-sm text-gray-500 mt-2">
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
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">
              Upload and Analyze Data
            </h2>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload CSV File
              </label>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              <p className="text-xs text-gray-500 mt-2">
                Upload a CSV file to get AI-powered analysis and insights
              </p>
            </div>

            <button
              onClick={handleFileUpload}
              disabled={loading || !file}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed mb-6"
            >
              {loading ? "Analyzing..." : "Analyze Data"}
            </button>

            {uploadResponse && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold mb-4">
                  Analysis Results for {uploadResponse.filename}
                </h3>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <p className="text-2xl font-bold text-blue-600">
                      {uploadResponse.rowCount}
                    </p>
                    <p className="text-sm text-gray-600">Total Rows</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <p className="text-2xl font-bold text-blue-600">
                      {uploadResponse.columnCount}
                    </p>
                    <p className="text-sm text-gray-600">Total Columns</p>
                  </div>
                </div>

                {uploadResponse.columns.length > 0 && (
                  <>
                    <h4 className="font-semibold mb-3">Columns:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                      {uploadResponse.columns.map((column, index) => (
                        <div
                          key={index}
                          className="bg-white p-3 rounded-lg shadow-sm"
                        >
                          <p className="font-medium text-gray-900">
                            {column.name}
                          </p>
                          <p className="text-sm text-gray-500 capitalize">
                            {column.type}
                          </p>
                          {column.sampleValues.length > 0 && (
                            <p className="text-xs text-gray-400 mt-1">
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
                    <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
                      <p className="text-gray-700 whitespace-pre-wrap">
                        {uploadResponse.analysis}
                      </p>
                    </div>
                  </>
                )}

                {uploadResponse.sampleData.length > 0 && (
                  <>
                    <h4 className="font-semibold mb-3">
                      Sample Data (first {uploadResponse.sampleData.length}{" "}
                      rows):
                    </h4>
                    <div className="overflow-x-auto">
                      <table className="min-w-full bg-white border border-gray-200">
                        <thead>
                          <tr>
                            {Object.keys(uploadResponse.sampleData[0]).map(
                              (key) => (
                                <th
                                  key={key}
                                  className="px-3 py-2 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase"
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
                                  className="px-3 py-2 border-b border-gray-200 text-sm"
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
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
                    <h4 className="font-semibold text-red-800 mb-2">Error:</h4>
                    <p className="text-red-600">{uploadResponse.error}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <footer className="text-center mt-12 text-gray-500 text-sm">
          <p>
            AI Copilot for Data Teams - Built with Next.js, OpenAI, and
            PostgreSQL
          </p>
        </footer>
      </div>
    </div>
  );
}
