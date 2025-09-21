"use client";
import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { SQLResponse, UploadResponse } from "@/lib/types";
import { askQuestion } from "@/lib/api";
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";
import Ascii from "./Ascii";

export default function HeroSectionOne() {
  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState<{ sender: "user" | "ai"; text: string }[]>([]);
  const [input, setInput] = useState("");
  const router = useRouter()

  const [question, setQuestion] = useState("");
  const [response, setResponse] = useState<SQLResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const mainContentRef = useRef<HTMLDivElement>(null);
  const handleScrollToContent = () => mainContentRef.current?.scrollIntoView({ behavior: "smooth" });

  // This function sends the user's question and fetches the AI response
  const handleSend = async () => {
    if (input.trim() === "") return;

    // Add user question to messages
    setMessages((prev) => [...prev, { sender: "user", text: input }]);

    setLoading(true);
    try {
      const result: SQLResponse = await askQuestion(input, true);
      setResponse(result);

      // Format AI response (SQL + explanation + error)
      let aiText = "";
      if (result?.error) aiText = result.error;
      else {
        if (result?.sql) aiText += `SQL:\n${result.sql}\n`;
        if (result?.explanation) aiText += `Explanation:\n${result.explanation}`;
      }

      // Add AI response to messages
      setMessages((prev) => [...prev, { sender: "ai", text: aiText }]);
    } catch (err) {
      setMessages((prev) => [...prev, { sender: "ai", text: "Failed to get response. Please try again." }]);
    } finally {
      setLoading(false);
      setInput("");
      handleScrollToContent();
    }
  };

  return (
    <div className="relative mx-auto my-10 flex max-w-7xl flex-col items-center justify-center">
      <Navbar />

      {/* Divider lines */}
      <div className="absolute inset-y-0 left-0 h-full w-px bg-neutral-200/80 dark:bg-neutral-800/80"></div>
      <div className="absolute inset-y-0 right-0 h-full w-px bg-neutral-200/80 dark:bg-neutral-800/80"></div>
      <div className="absolute inset-x-0 bottom-0 h-px w-full bg-neutral-200/80 dark:bg-neutral-800/80"></div>

      <div className="px-4 py-10 md:py-20 w-full flex flex-col items-center">
        {/* Title always visible */}
        <h1 className="relative z-10 mx-auto max-w-4xl text-center text-2xl font-bold text-white md:text-4xl lg:text-7xl dark:text-slate-300">
          {"AI Copilot for Your Data"
            .split(" ")
            .map((word, index) => (
              <motion.span
                key={index}
                initial={{ opacity: 0, filter: "blur(4px)", y: 10 }}
                animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1, ease: "easeInOut" }}
                className="mr-2 inline-block"
              >
                {word}
              </motion.span>
            ))}
        </h1>

        {/* Show either hero content or chat */}
        {!showChat ? (
          <>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.8 }}
              className="relative z-10 mx-auto max-w-xl py-4 text-center text-lg font-normal text-[#F8FAFC] dark:text-neutral-400"
            >
              Translate natural language questions into SQL, analyze datasets instantly, and get the insights you need. Privacy-friendly and effortless.
            </motion.p>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.8 }}
              className="relative z-10 mx-auto max-w-xl py-4 text-center"
            >
              <HeroCodeBlock />
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 1 }}
              className="relative z-10 mt-8 flex flex-wrap items-center justify-center gap-4"
            >
              <button
                onClick={() => setShowChat(true)}
                className="w-60 transform rounded-lg border border-gray-300 bg-black px-6 py-2 font-medium text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
              >
                Ask Question
              </button>
              <button
                onClick={() => router.push("/analyse")}
                className="w-60 relative group overflow-hidden rounded-lg px-6 py-2 font-medium text-white transition-all duration-300 border border-white/15 bg-[linear-gradient(135deg,#1a1a1a,#101010)] hover:border-white/30 hover:-translate-y-0.5 shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_4px_10px_-2px_rgba(0,0,0,0.6),0_8px_24px_-4px_rgba(0,0,0,0.5)]"
              >
                <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-[radial-gradient(circle_at_30%_0%,rgba(255,255,255,0.15),transparent_65%)]" />
                <span className="relative">Analyse Data</span>
              </button>
            </motion.div>
          </>
        ) : (
          <motion.div
            ref={mainContentRef}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-xl flex flex-col items-center mt-10"
          >
            {/* Messages area */}
            <div className="w-full h-80 overflow-y-auto border rounded-2xl p-4 mb-4 
                backdrop-blur-lg  shadow-inner">
              {messages.length === 0 ? (
                <p className="text-zinc-500 dark:text-zinc-400 text-center">
                  Start asking questions...
                </p>
              ) : (
                messages.map((msg, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`mb-4 flex ${msg.sender === "user" ? "justify-end" : "justify-start"
                      }`}
                  >
                    <div
                      className={`max-w-[80%] px-4 py-3 rounded-2xl shadow-md text-sm sm:text-base leading-relaxed
            ${msg.sender === "user"
                          ? " bg-indigo-600 text-white"
                          : "bg-gradient-to-r from-neutral-800 to-green-900 text-zinc-100  border border-white/10"
                        }`}
                    >
                      {/* Check if AI message contains code */}
                      {msg.sender !== "user" && msg.text.includes("```") ? (
                        <pre className="whitespace-pre-wrap overflow-x-auto rounded-lg p-3 text-green-600 text-sm font-mono">
                          {msg.text.replace(/```/g, "")}
                        </pre>
                      ) : (
                        <span>{msg.text}</span>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Input area */}
            <div className="flex w-full items-center rounded-full border border-white/10 
                bg-black/20 dark:bg-neutral-900 px-2 py-2 shadow-inner 
                focus-within:ring-2 focus-within:ring-blue-500 transition">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your question..."
                className="flex-1 bg-transparent outline-none px-4 text-sm sm:text-base 
               text-white placeholder:text-zinc-500"
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                disabled={loading}
              />
              <button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="ml-2 rounded-full bg-blue-600 px-5 py-2 text-sm sm:text-base font-medium 
               text-white shadow-md hover:bg-blue-700 
               disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {loading ? "..." : "Send"}
              </button>
            </div>

            <button
              onClick={() => router.push("/analyse")}
              className="mt-4 w-60 relative group overflow-hidden rounded-lg px-6 py-2 font-medium text-white transition-all duration-300 border border-white/15 bg-[linear-gradient(135deg,#1a1a1a,#101010)] hover:border-white/30 hover:-translate-y-0.5 shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_4px_10px_-2px_rgba(0,0,0,0.6),0_8px_24px_-4px_rgba(0,0,0,0.5)]"
            >
              <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-[radial-gradient(circle_at_70%_0%,rgba(255,255,255,0.15),transparent_65%)]" />
              <span className="relative flex items-center justify-center gap-2">
                <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z" />
                </svg>
                Analyse Data
              </span>
            </button>
          </motion.div>
        )}
      </div>

    </div>
  );
}

const HeroCodeBlock = () => (
  <div className="mt-10 relative max-w-2xl mx-auto">
    <div className="absolute -inset-0.5 bg-gradient-to-r from-green-400 via-blue-500 to-purple-600 rounded-xl blur-lg opacity-40"></div>
    <pre className="relative p-4 rounded-xl overflow-x-auto bg-black/80 text-sm border border-white/10 backdrop-blur-sm">
      <code className="language-sql text-zinc-300">
        <span className="text-purple-400">SELECT</span> customer_name,{" "}
        <span className="text-blue-400">SUM</span>(purchase_amount){" "}
        <span className="text-purple-400">AS</span> total_spent
        <br />
        <span className="text-purple-400">FROM</span> orders
        <br />
        <span className="text-purple-400">WHERE</span> order_date {">"}{" "}
              <span className="text-green-300">&#39;2024-01-01&#39;</span>
        <br />
        <span className="text-purple-400">GROUP BY</span> customer_name
        <br />
        <span className="text-purple-400">ORDER BY</span> total_spent{" "}
        <span className="text-purple-400">DESC</span>
        <br />
        <span className="text-purple-400">LIMIT</span>{" "}
        <span className="text-yellow-300">5</span>;
      </code>
    </pre>
  </div>
);

const Navbar = () => {
  return (
    <nav className="sticky top-0 z-50 flex w-full items-center justify-center 
                    px-4 py-4 bg-black/70 backdrop-blur-md border-b 
                    border-neutral-800 shadow-lg overflow-x-auto">
      <Ascii />
    </nav>
  );
};
