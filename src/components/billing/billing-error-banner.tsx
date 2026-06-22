"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { XIcon } from "lucide-react";

type BillingErrorBannerProps = {
	initialError?: string;
};

export function BillingErrorBanner({ initialError }: BillingErrorBannerProps) {
	const searchParams = useSearchParams();
	const router = useRouter();
	const error = initialError || searchParams.get("error");
	const [dismissed, setDismissed] = useState(false);

	if (!error || dismissed) return null;

	function handleDismiss() {
		setDismissed(true);
		router.replace("/billing");
	}

	return (
		<div
			role="alert"
			className="flex items-start justify-between gap-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800"
		>
			<p className="text-sm">{decodeURIComponent(error)}</p>
			<button
				type="button"
				onClick={handleDismiss}
				className="shrink-0 rounded-md p-1 hover:bg-red-100"
				aria-label="Dismiss error"
			>
				<XIcon className="size-4" />
			</button>
		</div>
	);
}
