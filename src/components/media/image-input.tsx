"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  SparklesIcon,
  UploadIcon,
  Loader2Icon,
  XIcon,
  ImageIcon,
} from "lucide-react";

const ACCEPTED = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024;

export interface ImageInputAI {
  /** AI assist action, e.g. "campaignImage". */
  action: string;
  /** Context sent to /api/campaigns/ai/assist. */
  context: Record<string, unknown>;
  /** How many times "Regenerate" may be used after the first generation. */
  maxRegenerations?: number;
}

interface ImageInputProps {
  value: string;
  onChange: (url: string) => void;
  /** Folder for /api/upload (e.g. "campaigns"). */
  uploadType?: string;
  ai?: ImageInputAI;
  /** Preview height class, defaults to h-40. */
  previewClass?: string;
  urlPlaceholder?: string;
}

export function ImageInput({
  value,
  onChange,
  uploadType = "campaigns",
  ai,
  previewClass = "h-40",
  urlPlaceholder = "https://.../image.png",
}: ImageInputProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generatedOnce, setGeneratedOnce] = useState(false);
  const [regenUsed, setRegenUsed] = useState(0);
  const [aiKind, setAiKind] = useState<string | null>(null);

  const maxRegen = ai?.maxRegenerations ?? 2;
  const regenExhausted = generatedOnce && regenUsed >= maxRegen;

  async function handleGenerate() {
    if (!ai || generating || regenExhausted) return;
    setGenerating(true);
    try {
      const variation = generatedOnce ? regenUsed + 1 : 0;
      const res = await fetch("/api/campaigns/ai/assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: ai.action,
          context: { ...ai.context, variation },
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Image generation failed");
      if (!data.url) throw new Error("No image returned");
      onChange(String(data.url));
      setAiKind(data.kind ? String(data.kind) : null);
      if (generatedOnce) setRegenUsed((n) => n + 1);
      else setGeneratedOnce(true);
      toast.success(
        data.kind ? `Generated a ${data.kind} image` : "Image generated"
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Image generation failed");
    } finally {
      setGenerating(false);
    }
  }

  async function handleFile(file: File | null | undefined) {
    if (!file) return;
    if (!ACCEPTED.includes(file.type)) {
      toast.error("Use a JPG, PNG, GIF, or WebP image");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("Image is too large (max 5MB)");
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("type", uploadType);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Upload failed");
      onChange(String(data.url));
      toast.success("Image uploaded");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  const generateLabel = !generatedOnce
    ? "Generate with AI"
    : `Regenerate (${Math.max(0, maxRegen - regenUsed)} left)`;

  return (
    <div className="space-y-3">
      {/* Preview */}
      <div className="relative overflow-hidden rounded-lg border border-[#ebeef0] bg-[#f7f8fa]">
        {value ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value}
              alt="Campaign image"
              className={`w-full ${previewClass} object-cover`}
            />
            <button
              type="button"
              onClick={() => {
                onChange("");
                setAiKind(null);
              }}
              className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-full bg-black/55 text-white transition-colors hover:bg-black/75"
              aria-label="Remove image"
            >
              <XIcon className="size-4" />
            </button>
            {aiKind && (
              <span className="absolute bottom-2 left-2 rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-medium text-white">
                AI · {aiKind}
              </span>
            )}
          </>
        ) : (
          <div
            className={`flex ${previewClass} w-full flex-col items-center justify-center gap-1 text-muted-foreground`}
          >
            <ImageIcon className="size-6 opacity-60" />
            <span className="text-xs">No image set</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        {ai && (
          <Button
            type="button"
            size="sm"
            onClick={handleGenerate}
            disabled={generating || regenExhausted}
            className="gap-1.5"
          >
            {generating ? (
              <Loader2Icon className="size-4 animate-spin" />
            ) : (
              <SparklesIcon className="size-4" />
            )}
            {generating ? "Generating…" : generateLabel}
          </Button>
        )}
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="gap-1.5"
        >
          {uploading ? (
            <Loader2Icon className="size-4 animate-spin" />
          ) : (
            <UploadIcon className="size-4" />
          )}
          {uploading ? "Uploading…" : "Upload"}
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept={ACCEPTED.join(",")}
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </div>

      {ai && regenExhausted && (
        <p className="text-xs text-muted-foreground">
          You&apos;ve used all AI regenerations. Upload or paste a URL to change
          the image.
        </p>
      )}

      {/* URL */}
      <div className="space-y-1">
        <Label htmlFor="image_url_input" className="text-xs text-muted-foreground">
          Or paste an image URL
        </Label>
        <Input
          id="image_url_input"
          placeholder={urlPlaceholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </div>
  );
}
