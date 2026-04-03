"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export interface BrandFormData {
  url: string;
  description: string;
  logo_url: string;
  background_image: string;
  slug: string;
}

interface BrandFormProps {
  initialData?: Partial<BrandFormData>;
  onSubmit: (data: BrandFormData) => Promise<void>;
  isLoading: boolean;
  title?: string;
  /** When true, shows only url and description fields (for creating new brands) */
  minimal?: boolean;
}

export function BrandForm({
  initialData,
  onSubmit,
  isLoading,
  title = "Brand Details",
  minimal = false,
}: BrandFormProps) {
  const [formData, setFormData] = useState<BrandFormData>({
    url: initialData?.url ?? "",
    description: initialData?.description ?? "",
    logo_url: initialData?.logo_url ?? "",
    background_image: initialData?.background_image ?? "",
    slug: initialData?.slug ?? "",
  });

  const [errors, setErrors] = useState<Partial<Record<keyof BrandFormData, string>>>({});

  function validate(): boolean {
    const newErrors: Partial<Record<keyof BrandFormData, string>> = {};

    if (!formData.url.trim()) {
      newErrors.url = "URL is required";
    } else {
      try {
        new URL(formData.url);
      } catch {
        newErrors.url = "Please enter a valid URL (e.g., https://example.com)";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    await onSubmit(formData);
  }

  function handleChange(
    field: keyof BrandFormData,
    value: string
  ) {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="url">Website URL *</Label>
            <Input
              id="url"
              type="url"
              placeholder="https://example.com"
              value={formData.url}
              onChange={(e) => handleChange("url", e.target.value)}
              disabled={isLoading}
            />
            {errors.url && (
              <p className="text-sm text-destructive">{errors.url}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Brief description of this brand..."
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              disabled={isLoading}
              rows={3}
            />
          </div>

          {!minimal && (
            <>
              <div className="space-y-2">
                <Label htmlFor="logo_url">Logo URL</Label>
                <Input
                  id="logo_url"
                  type="url"
                  placeholder="https://example.com/logo.png"
                  value={formData.logo_url}
                  onChange={(e) => handleChange("logo_url", e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="background_image">Background Image URL</Label>
                <Input
                  id="background_image"
                  type="url"
                  placeholder="https://example.com/background.jpg"
                  value={formData.background_image}
                  onChange={(e) =>
                    handleChange("background_image", e.target.value)
                  }
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  placeholder="my-brand"
                  value={formData.slug}
                  onChange={(e) => handleChange("slug", e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </>
          )}
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Brand"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
