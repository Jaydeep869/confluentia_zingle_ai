"use client";
import React from 'react';
import { cn } from '@/lib/utils';

interface AuroraBackgroundProps {
	children?: React.ReactNode;
	className?: string;
	showOverlay?: boolean;
}

// Simple CSS driven aurora effect using multiple blurred moving radial gradients
export const AuroraBackground: React.FC<AuroraBackgroundProps> = ({ children, className, showOverlay = true }) => {
	return (
		<div className={cn('relative w-full h-full overflow-hidden rounded-xl', className)}>
			<div className="absolute inset-0 -z-10">
				<div className="absolute -top-1/2 -left-1/2 w-[120%] h-[120%] [background:radial-gradient(circle_at_30%_30%,rgba(99,102,241,0.55),transparent_60%),radial-gradient(circle_at_70%_40%,rgba(236,72,153,0.45),transparent_65%),radial-gradient(circle_at_40%_70%,rgba(16,185,129,0.45),transparent_60%)] animate-[auroraMove_18s_linear_infinite] blur-3xl opacity-70" />
				<div className="absolute -top-1/2 -right-1/2 w-[120%] h-[120%] [background:radial-gradient(circle_at_70%_60%,rgba(14,165,233,0.5),transparent_60%),radial-gradient(circle_at_30%_70%,rgba(168,85,247,0.4),transparent_60%)] animate-[auroraMove_22s_linear_infinite_reverse] blur-3xl opacity-60" />
			</div>
			{showOverlay && <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(to_bottom,rgba(10,10,15,0.6),rgba(10,10,15,0.9))] mix-blend-multiply" />}
			<div className="relative z-10">
				{children}
			</div>
			<style jsx global>{`
				@keyframes auroraMove { 0% { transform:translate3d(0,0,0) rotate(0deg);} 50% { transform:translate3d(5%, -4%,0) rotate(180deg);} 100% { transform:translate3d(0,0,0) rotate(360deg);} }
			`}</style>
		</div>
	);
};

AuroraBackground.displayName = 'AuroraBackground';

