"use client";

import { useState } from "react";
import Link from "next/link";

export default function AskPage() {
	const [query, setQuery] = useState("");

	return (
		<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-white p-6">
			<div className="w-full max-w-2xl space-y-4 bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
				<h1 className="text-2xl font-semibold">Ask</h1>
				<p className="text-sm text-zinc-400">Enter your question below. You can jump to Analyze afterwards.</p>
				<input
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					placeholder="e.g., What's the max price by item name?"
					className="w-full px-4 py-3 rounded-xl bg-zinc-800/60 border border-white/10 text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/30"
				/>

				<div className="flex items-center justify-between">
					<div className="text-xs text-zinc-500">Tip: Press Enter to submit in other views.</div>
					{query.trim() && (
						<Link
							href="/analyse"
							className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-black px-4 py-2 text-sm font-medium hover:bg-zinc-900 transition"
						>
							Go to Analyze →
						</Link>
					)}
				</div>
			</div>
		</div>
	);
}

