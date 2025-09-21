"use client";
import { Button } from "@/components/ui/button";
import { askCsvQuestion, uploadFile } from "@/lib/api";
import { UploadResponse } from "@/lib/types";
import { redirect } from "next/navigation";
import React, { useState } from "react";

const CsvPage = () => {
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [uploadResponse, setUploadResponse] = useState<UploadResponse | null>(null);

    const [csvQuestion, setCsvQuestion] = useState("");
    const [csvAnswer, setCsvAnswer] = useState<{
        sql?: string;
        python?: string;
        explanation?: string;
        error?: string;
        preview?: any[];
    } | null>(null);
    const [csvLoading, setCsvLoading] = useState(false);

    // File upload handler
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

    // CSV question handler
    const handleCsvAsk = async () => {
        if (!uploadResponse?.datasetId || !csvQuestion.trim()) return;
        setCsvLoading(true);
        setCsvAnswer(null);
        try {
            const result = await askCsvQuestion(uploadResponse.datasetId, csvQuestion);
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
        <div className="min-h-screen p-6 bg-gray-900 dark:bg-black text-white flex flex-col items-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-8 text-center">
                Upload & Analyze CSV
            </h1>

            {/* File Upload */}
            {/* File Upload */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-2xl mb-8 p-4 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 rounded-2xl shadow-lg border border-indigo-500/20">
                <label className="relative w-full sm:w-auto">
                    <input
                        type="file"
                        accept=".csv"
                        onChange={handleFileChange}
                        className="hidden"
                        id="file-upload"
                    />
                    <span className="flex items-center justify-center px-6 py-3 bg-white dark:bg-gray-900 rounded-xl cursor-pointer border border-gray-300 dark:border-gray-700 shadow-md hover:shadow-xl hover:scale-[1.02] transition-transform duration-200">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 mr-2 text-indigo-600 dark:text-indigo-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M12 12V4m0 8l-3-3m3 3l3-3"
                            />
                        </svg>
                        {file ? file.name : "Choose CSV File"}
                    </span>
                </label>

                <button
                    onClick={handleFileUpload}
                    disabled={!file || loading}
                    className="px-8 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 shadow-md hover:shadow-xl hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? (
                        <span className="flex items-center gap-2">
                            <svg
                                className="animate-spin h-5 w-5 text-white"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                            >
                                <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                ></circle>
                                <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8v8H4z"
                                ></path>
                            </svg>
                            Analyzing...
                        </span>
                    ) : (
                        "Analyze Data"
                    )}
                </button>
            </div>


            {/* Upload Info */}
            {uploadResponse && (
                <div className="w-full max-w-xl p-6 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg">
                    <h2 className="text-xl font-semibold mb-4">
                        Analysis Results: {uploadResponse.filename}
                    </h2>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="bg-white/10 p-4 rounded-lg text-center">
                            <p className="text-2xl font-bold">{uploadResponse.rowCount}</p>
                            <p className="text-sm text-zinc-400">Rows</p>
                        </div>
                        <div className="bg-white/10 p-4 rounded-lg text-center">
                            <p className="text-2xl font-bold">{uploadResponse.columnCount}</p>
                            <p className="text-sm text-zinc-400">Columns</p>
                        </div>
                    </div>

                    {/* Columns */}
                    {uploadResponse.columns.length > 0 && (
                        <>
                            <h4 className="font-semibold mb-3">Columns</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                                {uploadResponse.columns.map((col, idx) => (
                                    <div
                                        key={idx}
                                        className="bg-white/10 p-3 rounded-lg border border-white/10"
                                    >
                                        <p className="font-medium">{col.name}</p>
                                        <p className="text-sm text-zinc-400 capitalize">{col.type}</p>
                                        {col.sampleValues.length > 0 && (
                                            <p className="text-xs text-zinc-500 mt-1">
                                                Sample: {col.sampleValues.slice(0, 3).join(", ")}
                                                {col.sampleValues.length > 3 && "..."}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </>
                    )}

                    {/* AI Analysis */}
                    {uploadResponse.analysis && (
                        <div className="bg-white/10 p-4 rounded-lg border border-white/10 mb-4">
                            <p className="whitespace-pre-wrap">{uploadResponse.analysis}</p>
                        </div>
                    )}

                    {/* Ask CSV Question */}
                    {uploadResponse.datasetId && (
                        <div className="mt-4">
                            <h4 className="font-semibold mb-2">Ask about this dataset</h4>
                            <div className="flex flex-col sm:flex-row gap-2 mb-4">
                                <input
                                    type="text"
                                    value={csvQuestion}
                                    onChange={(e) => setCsvQuestion(e.target.value)}
                                    placeholder={`Ask a question about ${uploadResponse.tableName || "this CSV"}`}
                                    className="flex-1 px-4 py-3 rounded-l-xl bg-black/30 border border-white/10 text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-white/20"
                                    onKeyDown={(e) => e.key === "Enter" && handleCsvAsk()}
                                />
                                <button
                                    onClick={handleCsvAsk}
                                    disabled={csvLoading || !csvQuestion.trim()}
                                    className="px-6 py-3 rounded-r-xl bg-white text-black font-medium hover:bg-zinc-200 disabled:opacity-50 transition"
                                >
                                    {csvLoading ? "Thinking..." : "Ask Dataset"}
                                </button>
                            </div>

                            {/* CSV Answer */}
                            {csvAnswer && (
                                <div className="space-y-4">
                                    {csvAnswer.error && (
                                        <div className="p-4 rounded-lg bg-red-500/10 text-red-200 border border-red-500/30">
                                            {csvAnswer.error}
                                        </div>
                                    )}
                                    {csvAnswer.sql && (
                                        <div>
                                            <h5 className="font-semibold mb-2">SQL</h5>
                                            <pre className="p-4 rounded-lg overflow-x-auto bg-black/50 text-green-300 border border-white/10">
                                                {csvAnswer.sql}
                                            </pre>
                                        </div>
                                    )}
                                    {csvAnswer.python && (
                                        <div>
                                            <h5 className="font-semibold mb-2">Python Script</h5>
                                            <pre className="p-4 rounded-lg overflow-x-auto bg-black/50 text-zinc-200 border border-white/10">
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
                                                            {Object.keys(csvAnswer.preview[0]).map((key) => (
                                                                <th
                                                                    key={key}
                                                                    className="px-3 py-2 border-b border-white/10 bg-white/5 text-left text-xs font-medium text-zinc-300 uppercase"
                                                                >
                                                                    {key}
                                                                </th>
                                                            ))}
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {csvAnswer.preview.map((row, idx) => (
                                                            <tr key={idx}>
                                                                {Object.values(row).map((val, j) => (
                                                                    <td key={j} className="px-3 py-2 border-b border-white/10 text-sm text-zinc-200">
                                                                        {typeof val === "object" ? JSON.stringify(val) : String(val)}
                                                                    </td>
                                                                ))}
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
            <Button className="border-2" onClick={() => redirect("/")}>Back to Homepage ←</Button>
        </div>

    );
};

export default CsvPage;
