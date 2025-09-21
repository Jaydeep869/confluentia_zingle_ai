// /src/app/page.tsx
"use client";

import { useState, useRef } from "react";
import { askQuestion, uploadFile, askCsvQuestion } from "@/lib/api";
import { SQLResponse, UploadResponse } from "@/lib/types";
import HeroSectionOne from "@/components/hero-section-demo-1";

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

  // Ref for scrolling to the main content
  const mainContentRef = useRef<HTMLDivElement>(null);

  const handleScrollToContent = () => {
    mainContentRef.current?.scrollIntoView({ behavior: "smooth" });
  };

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

      <div className="max-w-5xl mx-auto px-4">
        <HeroSectionOne/>
        {/* Footer */}
        <footer className="text-center mt-12 pb-14 text-zinc-400 text-sm">
          <p>AI Copilot for Data Teams — Next.js, Gemini, PostgreSQL</p>
        </footer>
      </div>
    </div>
  );
}