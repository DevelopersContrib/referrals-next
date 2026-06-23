"use client";

import { useCallback, useRef, useState } from "react";
import Image from "next/image";
import { Loader2Icon, Trash2Icon, UploadIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	CardDescription,
} from "@/components/ui/card";

type BannerItem = {
	id: string;
	name: string;
	campaign: string;
	linkUrl: string;
	imageUrl: string;
	fileSize: number;
	width?: number;
	height?: number;
	uploadedAt: string;
};

type BannerManagerProps = {
	campaigns: { id: number; name: string }[];
};

function formatFileSize(bytes: number) {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function BannerManager({ campaigns }: BannerManagerProps) {
	const fileRef = useRef<HTMLInputElement>(null);
	const [preview, setPreview] = useState<string | null>(null);
	const [previewFile, setPreviewFile] = useState<File | null>(null);
	const [dimensions, setDimensions] = useState<{
		width: number;
		height: number;
	} | null>(null);
	const [name, setName] = useState("");
	const [campaign, setCampaign] = useState("");
	const [linkUrl, setLinkUrl] = useState("");
	const [uploading, setUploading] = useState(false);
	const [banners, setBanners] = useState<BannerItem[]>([]);

	const handleFileSelect = useCallback((file: File) => {
		if (!file.type.startsWith("image/")) {
			toast.error("Please select an image file");
			return;
		}
		if (file.size > 5 * 1024 * 1024) {
			toast.error("File too large (max 5MB)");
			return;
		}
		setPreviewFile(file);
		setPreview(URL.createObjectURL(file));
		const img = new window.Image();
		img.onload = () => {
			setDimensions({ width: img.width, height: img.height });
		};
		img.src = URL.createObjectURL(file);
	}, []);

	async function handleUpload() {
		if (!previewFile || !name.trim()) {
			toast.error("Please provide a banner name and image");
			return;
		}
		setUploading(true);
		try {
			const formData = new FormData();
			formData.append("file", previewFile);
			formData.append("type", "banners");
			const res = await fetch("/api/upload", {
				method: "POST",
				body: formData,
			});
			const data = await res.json();
			if (!res.ok) {
				toast.error(data.error || "Upload failed");
				return;
			}
			const banner: BannerItem = {
				id: crypto.randomUUID(),
				name: name.trim(),
				campaign: campaign || "All campaigns",
				linkUrl: linkUrl.trim(),
				imageUrl: data.url,
				fileSize: previewFile.size,
				width: dimensions?.width,
				height: dimensions?.height,
				uploadedAt: new Date().toISOString(),
			};
			setBanners((prev) => [banner, ...prev]);
			setName("");
			setCampaign("");
			setLinkUrl("");
			setPreview(null);
			setPreviewFile(null);
			setDimensions(null);
			if (fileRef.current) fileRef.current.value = "";
			toast.success("Banner uploaded");
		} catch {
			toast.error("Upload failed");
		} finally {
			setUploading(false);
		}
	}

	function handleDelete(id: string) {
		setBanners((prev) => prev.filter((b) => b.id !== id));
		toast.success("Banner removed");
	}

	return (
		<div className="space-y-6">
			<Card>
				<CardHeader>
					<CardTitle>Upload Banner</CardTitle>
					<CardDescription>
						Upload a new banner image. Supported formats: JPG, PNG, GIF. Max
						size: 5MB.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<input
						ref={fileRef}
						type="file"
						accept="image/jpeg,image/png,image/gif,image/webp"
						className="hidden"
						onChange={(e) => {
							const file = e.target.files?.[0];
							if (file) handleFileSelect(file);
						}}
					/>
					<div
						className="flex min-h-48 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-[#ebeef0] bg-[#f7f8fa] p-4 transition-colors hover:border-brand/40"
						onClick={() => fileRef.current?.click()}
						onKeyDown={(e) => {
							if (e.key === "Enter") fileRef.current?.click();
						}}
						role="button"
						tabIndex={0}
					>
						{preview ? (
							<div className="relative h-40 w-full max-w-md">
								<Image
									src={preview}
									alt="Banner preview"
									fill
									className="rounded-md object-contain"
									unoptimized
								/>
							</div>
						) : (
							<>
								<UploadIcon className="mb-2 size-8 text-[#a7abc3]" />
								<p className="text-sm text-muted-foreground">
									Drag and drop an image here, or click to browse
								</p>
							</>
						)}
						<Button
							type="button"
							variant="outline"
							size="sm"
							className="mt-3 min-h-11"
							onClick={(e) => {
								e.stopPropagation();
								fileRef.current?.click();
							}}
						>
							Choose File
						</Button>
						{previewFile && (
							<p className="mt-2 text-xs text-muted-foreground">
								{previewFile.name} &middot;{" "}
								{formatFileSize(previewFile.size)}
								{dimensions &&
									` · ${dimensions.width}×${dimensions.height}px`}
							</p>
						)}
					</div>

					<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
						<div className="space-y-2">
							<Label htmlFor="banner-name">Banner Name</Label>
							<Input
								id="banner-name"
								value={name}
								onChange={(e) => setName(e.target.value)}
								placeholder="Summer promo banner"
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="banner-campaign">Target Campaign</Label>
							<select
								id="banner-campaign"
								value={campaign}
								onChange={(e) => setCampaign(e.target.value)}
								className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
							>
								<option value="">All campaigns</option>
								{campaigns.map((c) => (
									<option key={c.id} value={c.name}>
										{c.name}
									</option>
								))}
							</select>
						</div>
						<div className="space-y-2 sm:col-span-2">
							<Label htmlFor="banner-link">Link URL</Label>
							<Input
								id="banner-link"
								type="url"
								value={linkUrl}
								onChange={(e) => setLinkUrl(e.target.value)}
								placeholder="https://yoursite.com/promo"
							/>
						</div>
					</div>

					<Button
						type="button"
						className="min-h-11 bg-brand hover:bg-brand-hover"
						onClick={handleUpload}
						disabled={uploading || !previewFile}
					>
						{uploading && <Loader2Icon className="size-4 animate-spin" />}
						Save Banner
					</Button>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Your Banners</CardTitle>
					<CardDescription>
						Manage your existing campaign banners.
					</CardDescription>
				</CardHeader>
				<CardContent>
					{banners.length === 0 ? (
						<div className="py-12 text-center text-muted-foreground">
							No banners uploaded yet. Upload your first banner above.
						</div>
					) : (
						<div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
							{banners.map((banner) => (
								<div
									key={banner.id}
									className="overflow-hidden rounded-lg border border-[#ebeef0]"
								>
									<div className="relative aspect-[3/1] bg-[#f7f8fa]">
										<Image
											src={banner.imageUrl}
											alt={banner.name}
											fill
											className="object-cover"
											unoptimized
										/>
									</div>
									<div className="p-3">
										<p className="truncate font-medium">{banner.name}</p>
										<p className="text-xs text-muted-foreground">
											{banner.campaign} &middot;{" "}
											{new Date(banner.uploadedAt).toLocaleDateString()}
										</p>
										{banner.width && banner.height && (
											<p className="text-xs text-muted-foreground">
												{banner.width}×{banner.height}px &middot;{" "}
												{formatFileSize(banner.fileSize)}
											</p>
										)}
										<Button
											type="button"
											variant="ghost"
											size="sm"
											className="mt-2 min-h-11 text-red-600 hover:text-red-700"
											onClick={() => handleDelete(banner.id)}
										>
											<Trash2Icon className="size-4" />
											Delete
										</Button>
									</div>
								</div>
							))}
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
