"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
	title: string;
	defaultOpen?: boolean;
	children: React.ReactNode;
	persistKey?: string;
}

export function Collapsible({ title, defaultOpen = true, children, persistKey }: Props) {
	const [open, setOpen] = useState(defaultOpen);
	// load persisted
	useState(()=>{
		if(persistKey && typeof window !== 'undefined'){
			const raw = localStorage.getItem('collapsible:'+persistKey);
			if(raw==='open') setOpen(true);
			if(raw==='closed') setOpen(false);
		}
	});
	const toggle = () => setOpen(o=>{
		const v = !o; if(persistKey && typeof window!=='undefined'){ localStorage.setItem('collapsible:'+persistKey, v? 'open':'closed'); } return v; });
	return (
		<div className="rounded-lg border border-white/10 dark:border-zinc-700 bg-black/20 dark:bg-zinc-900/40">
			<button
				onClick={toggle}
				className="w-full flex items-center justify-between px-4 py-2 text-left text-sm font-medium hover:bg-white/5 dark:hover:bg-zinc-800/40"
			>
				<span>{title}</span>
				<span className="text-xs opacity-70">{open ? "−" : "+"}</span>
			</button>
			<AnimatePresence initial={false}>
				{open && (
					<motion.div
						initial={{ height: 0, opacity: 0 }}
						animate={{ height: "auto", opacity: 1 }}
						exit={{ height: 0, opacity: 0 }}
						transition={{ duration: 0.25 }}
						className="px-4 pb-4 pt-1 text-sm"
					>
						{children}
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}

export default Collapsible;
