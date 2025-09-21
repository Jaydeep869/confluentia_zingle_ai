"use client";
import { Button } from "@/components/ui/button";
import { askCsvQuestion, uploadFile } from "@/lib/api";
import { UploadResponse } from "@/lib/types";
import { redirect } from "next/navigation";
import React, { useState, useMemo } from "react";
import { useToast } from "@/components/ui/toast";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible } from "@/components/Collapsible";
import { AuroraBackground } from "@/components/ui/aurora-background";

const CsvPage = () => {
    const { notify } = useToast();
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
    const [columnFilter, setColumnFilter] = useState("");

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

    // Helpers
    const downloadSample = (rows: any[]) => {
        if(!rows || !rows.length) { notify('No sample rows'); return; }
        const headers = Object.keys(rows[0]);
        const csv = [headers.join(','), ...rows.map(r=> headers.map(h=> JSON.stringify(r[h] ?? '')).join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'sample.csv'; a.click();
        URL.revokeObjectURL(url);
        notify('Sample CSV downloaded');
    };

    const computeDensity = (u: UploadResponse) => {
        if(!u.sampleData || !u.sampleData.length) return 0;
        const totalCells = u.sampleData.length * u.columnCount;
        let filled = 0;
        for(const row of u.sampleData){
            for(const k of Object.keys(row)){
                const v = row[k];
                if(v !== null && v !== undefined && String(v).trim() !== '') filled++;
            }
        }
        return Math.round((filled/totalCells)*100);
    };

    const formatCell = (v: any) => {
        if(v === null || v === undefined) return '—';
        if(typeof v === 'object') return JSON.stringify(v);
        const s = String(v);
        return s.length > 120 ? s.slice(0,117)+'…' : s;
    };

    return (
        <div className="min-h-screen p-4 bg-gray-900 dark:bg-black text-white flex flex-col">
            <h1 className="text-2xl md:text-3xl font-bold mb-4 text-center">Upload & Analyze CSV</h1>
            <ResizablePanelGroup direction="horizontal" storageKey="analyse-panels" className="flex-1 gap-2">
                <ResizablePanel defaultSize={60} className="rounded-lg border border-white/10 bg-gradient-to-br from-zinc-900/60 via-zinc-900/40 to-zinc-800/30 p-4 overflow-y-auto">
                    <div className="mb-6 flex flex-col sm:flex-row items-center justify-center gap-4 w-full p-4 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 rounded-2xl shadow-lg border border-indigo-500/20">
                        <label className="relative w-full sm:w-auto">
                            <input type="file" accept=".csv" onChange={handleFileChange} className="hidden" />
                            <span className="w-60 transform rounded-lg border border-gray-300 bg-black px-6 py-2 font-medium text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 dark:border-gray-700 flex items-center justify-center cursor-pointer">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-indigo-500 dark:text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M12 12V4m0 8l-3-3m3 3l3-3" />
                                </svg>
                                {file ? file.name : "Choose CSV File"}
                            </span>
                        </label>
                        <button onClick={handleFileUpload} disabled={!file || loading} className="w-60 transform rounded-lg border border-gray-300 bg-white px-6 py-2 font-medium text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-700 dark:bg-black dark:text-white dark:hover:bg-gray-900 relative">
                            {loading && <span className="absolute inset-0 flex items-center justify-center"><svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-30" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg></span>}
                            <span className={loading? 'opacity-0':'relative'}>Analyse Data</span>
                        </button>
                    </div>
                                        {loading && (
                                                <div className="space-y-4">
                                                    <Skeleton className="h-24 w-full" />
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <Skeleton className="h-20" />
                                                        <Skeleton className="h-20" />
                                                    </div>
                                                    <Skeleton className="h-32 w-full" />
                                                </div>
                                        )}
                    {uploadResponse && !loading && (
                        <div className="w-full p-4 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg space-y-6">
                            {/* Header bar */}
                            <div className="flex flex-col md:flex-row md:items-center gap-3 justify-between">
                                <div>
                                    <h2 className="text-lg font-semibold">{uploadResponse.filename}</h2>
                                    <p className="text-xs text-zinc-400">Imported at {new Date(uploadResponse.timestamp).toLocaleTimeString()}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={()=> downloadSample(uploadResponse.sampleData)} className="text-xs px-3 py-2 rounded-md bg-black/60 border border-white/10 hover:bg-black/70 text-white">Download Sample CSV</button>
                                    <button onClick={()=> {setUploadResponse(null); setFile(null); setCsvAnswer(null); setCsvQuestion("");}} className="text-xs px-3 py-2 rounded-md bg-red-500/15 border border-red-500/30 text-red-200 hover:bg-red-500/25">Reset</button>
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <StatCard label="Rows" value={uploadResponse.rowCount} />
                                <StatCard label="Columns" value={uploadResponse.columnCount} />
                                <StatCard label="Sample Rows" value={uploadResponse.sampleData?.length || 0} />
                                <StatCard label="Data Density" value={computeDensity(uploadResponse)} suffix="%" />
                            </div>

                            {/* Columns Collapsible */}
                            <Collapsible title={`Columns (${uploadResponse.columnCount})`} defaultOpen persistKey="columns-section">
                                <div className="mb-3 flex items-center gap-2">
                                    <input value={columnFilter} onChange={e=>setColumnFilter(e.target.value)} placeholder="Filter columns..." className="w-full px-3 py-2 rounded-md bg-black/30 border border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/30" />
                                    <span className="text-xs text-zinc-400 whitespace-nowrap">{columnFilter? uploadResponse.columns.filter(c=>c.name.toLowerCase().includes(columnFilter.toLowerCase())).length : uploadResponse.columns.length} shown</span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                                    {uploadResponse.columns.filter(c=> !columnFilter || c.name.toLowerCase().includes(columnFilter.toLowerCase())).map((col, idx)=>(
                                        <div key={idx} className="relative group bg-gradient-to-br from-zinc-900/70 to-zinc-800/40 p-3 rounded-lg border border-white/10 hover:border-indigo-400/40 transition">
                                            <div className="flex items-center justify-between mb-1">
                                                <p className="font-medium text-sm">{col.name}</p>
                                                <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">{col.type}</span>
                                            </div>
                                            {col.sampleValues.length > 0 && (
                                                <p className="text-[11px] text-zinc-400 truncate">{col.sampleValues.slice(0,3).join(', ')}{col.sampleValues.length>3 && '…'}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </Collapsible>

                            {/* AI Insights */}
                            {uploadResponse.analysis && (
                                <Collapsible title="AI Insights" defaultOpen persistKey="ai-insights">
                                    <div className="prose prose-invert max-w-none text-sm leading-relaxed">
                                        <p className="whitespace-pre-wrap text-zinc-200">{uploadResponse.analysis}</p>
                                    </div>
                                </Collapsible>
                            )}

                            {/* Sample Data */}
                            {uploadResponse.sampleData && uploadResponse.sampleData.length>0 && (
                                <Collapsible title={`Sample Data (${uploadResponse.sampleData.length} rows)`} defaultOpen={false} persistKey="sample-data">
                                    <div className="overflow-x-auto rounded-lg border border-white/10">
                                        <table className="min-w-full text-xs">
                                            <thead className="bg-white/5 sticky top-0 backdrop-blur-sm">
                                                <tr>
                                                    {Object.keys(uploadResponse.sampleData[0]).map(key=> <th key={key} className="px-3 py-2 text-left font-medium text-zinc-300 border-b border-white/10">{key}</th>)}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {uploadResponse.sampleData.map((row,i)=> (
                                                    <tr key={i} className="odd:bg-white/[0.02] hover:bg-indigo-500/10 transition">
                                                        {Object.values(row).map((val,j)=> <td key={j} className="px-3 py-2 border-b border-white/5 text-zinc-200 whitespace-nowrap max-w-[240px] truncate">{formatCell(val)}</td>)}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </Collapsible>
                            )}
                        </div>
                    )}
                    <Button className="mt-4 border-2" onClick={() => redirect('/')}>Back ←</Button>
                </ResizablePanel>
                {uploadResponse && (
                    <>
                        <ResizableHandle />
                                                <ResizablePanel defaultSize={40} className="rounded-lg border border-white/10 bg-gradient-to-br from-zinc-900/60 via-zinc-900/40 to-zinc-800/30 p-4 overflow-y-auto">
                            <h2 className="text-lg font-semibold mb-4">Ask Dataset Questions</h2>
                            <div className="flex flex-col sm:flex-row gap-2 mb-4">
                <input type="text" value={csvQuestion} onChange={e=>setCsvQuestion(e.target.value)} placeholder={`Ask about ${uploadResponse.tableName || 'dataset'}`} onKeyDown={e=> e.key==='Enter' && handleCsvAsk()} className="flex-1 px-4 py-3 rounded-xl bg-zinc-800/50 border border-white/10 text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/30" />
                                <button onClick={handleCsvAsk} disabled={csvLoading || !csvQuestion.trim()} className="w-60 transform rounded-lg border border-gray-300 bg-black px-6 py-2 font-medium text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-white dark:text-black dark:hover:bg-gray-200 dark:border-gray-700 relative">
                                    {csvLoading && <span className="absolute inset-0 flex items-center justify-center"><svg className="animate-spin h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-30" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg></span>}
                                    <span className={csvLoading? 'opacity-0':'relative'}>Ask</span>
                                </button>
                            </div>
                            {csvAnswer && (
                                <AuroraBackground className="p-4 rounded-xl border border-white/10 bg-black/20">
                                                                <div className="space-y-4">
                                                                        {csvAnswer.error && <div className="p-3 rounded-lg bg-red-500/10 text-red-200 border border-red-500/30 text-sm">{csvAnswer.error}</div>}
                                                                        {csvAnswer.sql && (
                                                                              <Collapsible title="SQL" defaultOpen persistKey="dataset-sql">
                                                                                                                                                                <div className="flex items-center justify-end mb-2">
                                                                                                                                                                    <button
                                                                                                                                                                        onClick={()=>{navigator.clipboard.writeText(csvAnswer.sql||''); notify('SQL copied');}}
                                                                                                                                                                        className="group relative text-xs px-3 py-1.5 rounded-md font-medium text-white bg-[linear-gradient(135deg,#1a1a1a,#111)] border border-white/15 shadow hover:border-white/30 focus:outline-none focus:ring-2 focus:ring-cyan-400/40 overflow-hidden"
                                                                                                                                                                    >
                                                                                                                                                                        <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-[radial-gradient(circle_at_30%_0%,rgba(255,255,255,0.12),transparent_60%)]" />
                                                                                                                                                                        <span className="relative">Copy</span>
                                                                                                                                                                    </button>
                                                                                                                                                                </div>
                                                                                <pre className="p-3 rounded-lg overflow-x-auto bg-black/60 text-green-300 border border-white/10 text-xs leading-relaxed">{csvAnswer.sql}</pre>
                                                                            </Collapsible>
                                                                        )}
                                                                        {csvAnswer.python && (
                                                                              <Collapsible title="Python Script" defaultOpen persistKey="dataset-python">
                                                                                                                                                                <div className="flex items-center justify-end mb-2">
                                                                                                                                                                    <button
                                                                                                                                                                        onClick={()=>{navigator.clipboard.writeText(csvAnswer.python||''); notify('Python script copied');}}
                                                                                                                                                                        className="group relative text-xs px-3 py-1.5 rounded-md font-medium text-white bg-[linear-gradient(135deg,#1a1a1a,#111)] border border-white/15 shadow hover:border-white/30 focus:outline-none focus:ring-2 focus:ring-cyan-400/40 overflow-hidden"
                                                                                                                                                                    >
                                                                                                                                                                        <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-[radial-gradient(circle_at_30%_0%,rgba(255,255,255,0.12),transparent_60%)]" />
                                                                                                                                                                        <span className="relative">Copy</span>
                                                                                                                                                                    </button>
                                                                                                                                                                </div>
                                                                                <pre className="p-3 rounded-lg overflow-x-auto bg-black/60 text-zinc-200 border border-white/10 text-xs leading-relaxed">{csvAnswer.python}</pre>
                                                                            </Collapsible>
                                                                        )}
                                                                        {csvAnswer.preview && csvAnswer.preview.length>0 && (
                                                                              <Collapsible title={`Preview (${csvAnswer.preview.length} rows)`} defaultOpen={false} persistKey="dataset-preview">
                                                                                <div className="overflow-x-auto">
                                                                                    <table className="min-w-full bg-black/20 border border-white/10 rounded-md text-xs">
                                                                                        <thead>
                                                                                            <tr>
                                                                                                {Object.keys(csvAnswer.preview[0]).map(key=> <th key={key} className="px-3 py-2 border-b border-white/10 bg-white/5 text-left font-medium text-zinc-300 uppercase">{key}</th>)}
                                                                                            </tr>
                                                                                        </thead>
                                                                                        <tbody>
                                                                                            {csvAnswer.preview.map((row, idx)=>(
                                                                                                <tr key={idx}>{Object.values(row).map((val,j)=>(<td key={j} className="px-3 py-2 border-b border-white/10 text-zinc-200">{typeof val==='object'? JSON.stringify(val): String(val)}</td>))}</tr>
                                                                                            ))}
                                                                                        </tbody>
                                                                                    </table>
                                                                                </div>
                                                                            </Collapsible>
                                                                        )}
                                                                </div>
                                </AuroraBackground>
                            )}
                        </ResizablePanel>
                    </>
                )}
            </ResizablePanelGroup>
        </div>

    );
};

export default CsvPage;

// Small stat card component
const StatCard = ({label, value, suffix}:{label:string; value:any; suffix?:string}) => (
    <div className="relative overflow-hidden rounded-lg border border-white/10 bg-gradient-to-br from-zinc-900/70 to-zinc-800/40 p-4">
        <p className="text-[11px] uppercase tracking-wide text-zinc-400 mb-1">{label}</p>
        <p className="text-2xl font-semibold text-white">{value}{suffix || ''}</p>
        <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(circle_at_80%_0%,rgba(255,255,255,0.25),transparent_60%)]" />
    </div>
);
