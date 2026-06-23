"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

type WalkthroughStepImageProps = {
	src: string;
	alt: string;
	step: number;
	className?: string;
};

export function WalkthroughStepImage({
	src,
	alt,
	step,
	className,
}: WalkthroughStepImageProps) {
	const [failed, setFailed] = useState(false);

	if (failed) {
		return (
			<div
				className={cn(
					"flex aspect-video w-full items-center justify-center rounded-lg border border-[#ebeef0] bg-gradient-to-br from-[#f7f8fa] to-[#ffe5e7] text-sm text-[#a7abc3] shadow-md",
					className
				)}
			>
				Screenshot &mdash; Step {step}
			</div>
		);
	}

	return (
		<div
			className={cn(
				"relative aspect-video w-full overflow-hidden rounded-lg border border-[#ebeef0] shadow-md",
				className
			)}
		>
			<Image
				src={src}
				alt={alt}
				fill
				className="object-cover object-top"
				sizes="(max-width: 768px) 100vw, 50vw"
				onError={() => setFailed(true)}
			/>
		</div>
	);
}
