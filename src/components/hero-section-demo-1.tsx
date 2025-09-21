"use client";
import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { SQLResponse } from "@/lib/types";
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";
import Ascii from "./Ascii";

export default function HeroSectionOne() {
  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState<{ sender: "user" | "ai"; text: string }[]>([]);
  const [input, setInput] = useState("");
  const router = useRouter();
  const mainContentRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(false);

  const handleScrollToContent = () =>
    mainContentRef.current?.scrollIntoView({ behavior: "smooth" });

  const handleSend = async () => {
    if (!input.trim()) return;

    setMessages((prev) => [...prev, { sender: "user", text: input }]);
    setLoading(true);

    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: input, generateOnly: true }),
      });

      const data: SQLResponse = await res.json();

      let aiText = "";
      if (data.error) aiText = data.error;
      else {
        if (data.sql) aiText += `SQL:\n${data.sql}\n`;
        if (data.explanation) aiText += `Explanation:\n${data.explanation}`;
      }

      setMessages((prev) => [...prev, { sender: "ai", text: aiText }]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to get response";
      setMessages((prev) => [...prev, { sender: "ai", text: msg }]);
    } finally {
      setLoading(false);
      setInput("");
      handleScrollToContent();
    }
  };

  return (
    <div className="relative mx-auto my-10 flex max-w-7xl flex-col items-center justify-center">
      <Navbar />

      <div className="px-4 py-10 md:py-20 w-full flex flex-col items-center">
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
                className="w-60 relative group overflow-hidden rounded-lg px-6 py-2 font-medium text-white transition-all duration-300 border border-white/15 bg-[linear-gradient(135deg,#1a1a1a,#101010)] hover:border-white/30 hover:-translate-y-0.5"
              >
                Analyse Data
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
            <div className="w-full h-80 overflow-y-auto border rounded-2xl p-4 mb-4 backdrop-blur-lg shadow-inner">
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
                    className={`mb-4 flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] px-4 py-3 rounded-2xl shadow-md text-sm sm:text-base leading-relaxed
                        ${msg.sender === "user"
                          ? " bg-indigo-600 text-white"
                          : "bg-gradient-to-r from-neutral-800 to-green-900 text-zinc-100 border border-white/10"
                        }`}
                    >
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

            <div className="flex w-full items-center rounded-full border border-white/10 bg-black/20 dark:bg-neutral-900 px-2 py-2 shadow-inner focus-within:ring-2 focus-within:ring-blue-500 transition">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your question..."
                className="flex-1 bg-transparent outline-none px-4 text-sm sm:text-base text-white placeholder:text-zinc-500"
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                disabled={loading}
              />
              <button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="ml-2 rounded-full bg-blue-600 px-5 py-2 text-sm sm:text-base font-medium text-white shadow-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {loading ? "..." : "Send"}
              </button>
            </div>
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

const Navbar = () => (
  <nav className="sticky top-0 z-50 flex w-full items-center justify-center px-4 py-4 bg-black/70 backdrop-blur-md border-b border-neutral-800 shadow-lg overflow-x-auto">
    <Ascii />
  </nav>
);
