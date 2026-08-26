"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsTrigger } from "@/components/ui/tabs";
import { ScrollableTabsList } from "@/components/ui/scrollable-tabs-list";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { slugFromWebsite } from "@/lib/brand-slug";
import { SlugAvailabilityField } from "@/components/brands/slug-availability-field";
import { useSlugAvailability } from "@/hooks/use-slug-availability";
import { ImageInput } from "@/components/media/image-input";
import {
  ArrowLeftIcon,
  Trash2Icon,
  ExternalLinkIcon,
  LayoutDashboardIcon,
  PlusIcon,
  BarChart3Icon,
  CreditCardIcon,
  Loader2Icon,
  SparklesIcon,
} from "lucide-react";

const COLOR_ROLES: Array<{ key: string; label: string }> = [
  { key: "primary", label: "Primary" },
  { key: "secondary", label: "Secondary" },
  { key: "accent", label: "Accent" },
  { key: "background", label: "Background" },
  { key: "text", label: "Text" },
];

const DEFAULT_BACKGROUND = "https://cdn.vnoc.com/background/bgdefault.jpg";

export type BrandEditData = {
  id: number;
  url: string;
  domain: string;
  description: string | null;
  logo_url: string | null;
  background_image: string | null;
  slug: string | null;
  brand_colors: Record<string, string> | null;
};

type SocialForm = {
  facebook: string;
  twitter: string;
  instagram: string;
  youtube: string;
  linkedin: string;
  github: string;
  discord: string;
  telegram: string;
};

const SOCIAL_FIELDS: Array<{
  key: keyof SocialForm;
  label: string;
  help: string;
}> = [
  {
    key: "facebook",
    label: "Facebook URL",
    help: "https://www.facebook.com/name",
  },
  { key: "twitter", label: "X URL", help: "https://www.x.com/name" },
  {
    key: "instagram",
    label: "Instagram URL",
    help: "https://www.instagram.com/name",
  },
  {
    key: "youtube",
    label: "Youtube URL",
    help: "https://www.youtube.com/channel/id",
  },
  {
    key: "linkedin",
    label: "Linkedin URL",
    help: "https://www.linkedin.com/in/name-id/",
  },
  { key: "github", label: "Github URL", help: "https://www.github.com/name" },
  { key: "discord", label: "Discord URL", help: "https://www.discord.gg/id" },
  {
    key: "telegram",
    label: "Telegram URL",
    help: "https://www.telegram.com/id",
  },
];

interface BrandEditPanelProps {
  brandId: string;
  isPremium?: boolean;
}

export function BrandEditPanel({
  brandId,
  isPremium = false,
}: BrandEditPanelProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("t") === "social" ? "social" : "brand";

  const [brand, setBrand] = useState<BrandEditData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [tab, setTab] = useState(initialTab);
  const [domainStatus, setDomainStatus] = useState("");
  const [domainLink, setDomainLink] = useState("");
  const [brandColors, setBrandColors] = useState<Record<string, string>>({});
  const [colorsLoading, setColorsLoading] = useState(false);
  const [colorsMood, setColorsMood] = useState("");

  const [form, setForm] = useState({
    url: "",
    description: "",
    logo_url: "",
    background_image: DEFAULT_BACKGROUND,
    slug: "",
  });

  const formRef = useRef(form);
  formRef.current = form;
  const autoColorsTried = useRef(false);

  const slugAvailability = useSlugAvailability(form.slug, {
    excludeBrandId: Number(brandId),
    enabled: !loading,
  });
  const slugBlocked =
    slugAvailability.status === "taken" ||
    slugAvailability.status === "invalid";

  const [socials, setSocials] = useState<SocialForm>({
    facebook: "",
    twitter: "",
    instagram: "",
    youtube: "",
    linkedin: "",
    github: "",
    discord: "",
    telegram: "",
  });

  const loadBrand = useCallback(async () => {
    setLoading(true);
    try {
      const [brandRes, socialsRes] = await Promise.all([
        fetch(`/api/brands/${brandId}`),
        fetch(`/api/brands/${brandId}/socials`),
      ]);

      if (!brandRes.ok) throw new Error("Brand not found");

      const data: BrandEditData = await brandRes.json();
      setBrand(data);
      setForm({
        url: data.url || "",
        description:
          data.description && data.description !== "0" ? data.description : "",
        logo_url: data.logo_url && data.logo_url !== "0" ? data.logo_url : "",
        background_image: data.background_image || DEFAULT_BACKGROUND,
        slug: data.slug || "",
      });
      setBrandColors(
        data.brand_colors && typeof data.brand_colors === "object"
          ? data.brand_colors
          : {},
      );

      if (socialsRes.ok) {
        setSocials(await socialsRes.json());
      }
    } catch {
      toast.error("Failed to load brand");
    } finally {
      setLoading(false);
    }
  }, [brandId]);

  useEffect(() => {
    loadBrand();
  }, [loadBrand]);

  async function checkDomain(website: string) {
    if (website.trim().length < 4) return;
    setDomainStatus("Checking...");
    try {
      const res = await fetch("/api/brands/check-domain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ website, excludeBrandId: brandId }),
      });
      const data = await res.json();
      if (data.invalid_domain) {
        setDomainStatus("Invalid domain!");
        setDomainLink("");
      } else if (!data.available) {
        setDomainStatus(
          data.is_admin
            ? "This was already setup."
            : "Domain is not available!",
        );
        setDomainLink(data.url_link || "");
      } else {
        setDomainStatus("Domain is available!");
        setDomainLink("");
      }
    } catch {
      setDomainStatus("");
    }
  }

  function handleUrlChange(value: string) {
    const slug = slugFromWebsite(value);
    setForm((prev) => ({ ...prev, url: value, slug: slug || prev.slug }));
    checkDomain(value);
  }

  const generateColors = useCallback(
    async (
      source: "auto" | "logo" | "website" | "surprise" = "auto",
      opts: { silent?: boolean } = {},
    ) => {
      const website = formRef.current.url;
      const logo = formRef.current.logo_url;
      if (source === "logo" && !logo.trim()) {
        if (!opts.silent) toast.error("Add a logo first");
        return;
      }
      if (
        (source === "website" || source === "auto") &&
        !website.trim() &&
        !logo.trim()
      ) {
        if (!opts.silent) toast.error("Add a website URL or logo first");
        return;
      }
      setColorsLoading(true);
      try {
        const res = await fetch("/api/campaigns/ai/assist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "brandColors",
            context: { website, logoUrl: logo, source },
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "Failed to generate colors");
        if (data.colors && typeof data.colors === "object") {
          setBrandColors((prev) => ({ ...prev, ...data.colors }));
        }
        setColorsMood(typeof data.mood === "string" ? data.mood : "");
        if (!opts.silent) {
          toast.success("Brand colors generated — tweak and save");
        }
      } catch (e) {
        if (!opts.silent) {
          toast.error(
            e instanceof Error ? e.message : "Failed to generate colors",
          );
        }
      } finally {
        setColorsLoading(false);
      }
    },
    [],
  );

  // Automate: if a brand has no palette yet, generate one from its logo/website.
  useEffect(() => {
    if (loading || autoColorsTried.current) return;
    if (Object.keys(brandColors).length > 0) return;
    if (!form.url.trim() && !form.logo_url.trim()) return;
    autoColorsTried.current = true;
    void generateColors("auto", { silent: true });
  }, [loading, brandColors, form.url, form.logo_url, generateColors]);

  async function handleBrandSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.url.trim()) {
      toast.error("Website URL is required");
      return;
    }
    if (!form.slug.trim()) {
      toast.error("Slug is required");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/brands/${brandId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: form.url,
          description: form.description || null,
          logo_url: form.logo_url || null,
          background_image: form.background_image || null,
          slug: form.slug,
          brand_colors:
            Object.keys(brandColors).length > 0 ? brandColors : null,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        if (err.suggestion) {
          setForm((p) => ({ ...p, slug: err.suggestion }));
          throw new Error(`${err.error} We suggested ${err.suggestion}.`);
        }
        throw new Error(err.error || "Failed to update brand");
      }

      const updated = await res.json();
      setBrand(updated);
      toast.success("Brand updated successfully");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update brand",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleSocialSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/brands/${brandId}/socials`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(socials),
      });
      const data = await res.json();
      if (!res.ok || !data.status) {
        throw new Error(data.message || "Failed to save social urls");
      }
      toast.success(data.message);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to save socials",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/brands/${brandId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      toast.success("Brand deleted");
      router.push("/dashboard");
    } catch {
      toast.error("Failed to delete brand");
    } finally {
      setDeleting(false);
      setDeleteOpen(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-[#a7abc3]">
        <Loader2Icon className="size-5 animate-spin" />
        Loading brand...
      </div>
    );
  }

  if (!brand) {
    return (
      <div className="py-12 text-center">
        <p className="text-destructive">Brand not found</p>
        <Link href="/brands" className="mt-4 inline-block">
          <Button variant="outline">Back to Brands</Button>
        </Link>
      </div>
    );
  }

  const publicPath = form.slug ? `/p/${form.slug}` : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <Link
            href={`/brands/${brandId}`}
            className="mb-2 inline-flex items-center gap-1.5 text-sm font-medium text-white/90 hover:text-white"
          >
            <ArrowLeftIcon className="size-4" />
            Back to {brand.domain} Dashboard
          </Link>
          <h1 className="text-xl font-bold text-white">Edit Brand</h1>
        </div>
        <Button
          variant="destructive"
          className="gap-2"
          onClick={() => setDeleteOpen(true)}
        >
          <Trash2Icon className="size-4" />
          Delete Brand
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="portlet p-0">
          <Tabs value={tab} onValueChange={setTab}>
            <div className="min-w-0 border-b border-[#ebeef0] px-4 pt-4">
              <ScrollableTabsList
                activeValue={tab}
                aria-label="Brand settings sections"
                className="bg-transparent"
              >
                <TabsTrigger
                  value="brand"
                  data-tab-value="brand"
                  className="h-10 flex-none gap-1.5 px-3 data-active:text-brand data-active:after:bg-brand"
                >
                  Brand
                </TabsTrigger>
                <TabsTrigger
                  value="social"
                  data-tab-value="social"
                  className="h-10 flex-none gap-1.5 px-3 data-active:text-brand data-active:after:bg-brand"
                >
                  Social Media Brand
                </TabsTrigger>
                {isPremium && (
                  <TabsTrigger
                    value="whitelabel"
                    data-tab-value="whitelabel"
                    className="h-10 flex-none gap-1.5 px-3 data-active:text-brand data-active:after:bg-brand"
                  >
                    Whitelabel
                  </TabsTrigger>
                )}
              </ScrollableTabsList>
            </div>

            <TabsContent value="brand" className="p-6">
              <form
                onSubmit={handleBrandSubmit}
                className="mx-auto max-w-2xl space-y-5"
              >
                <div className="space-y-2">
                  <Label htmlFor="website">Website Url *</Label>
                  <Input
                    id="website"
                    value={form.url}
                    onChange={(e) => handleUrlChange(e.target.value)}
                    disabled={saving}
                  />
                  {domainStatus && (
                    <p
                      className={`text-sm font-medium ${
                        domainStatus.includes("available!")
                          ? "text-[#28a745]"
                          : domainStatus.includes("Checking")
                            ? "text-brand"
                            : "text-destructive"
                      }`}
                    >
                      {domainStatus}{" "}
                      {domainLink && (
                        <Link
                          href={domainLink}
                          target="_blank"
                          className="underline hover:text-brand"
                        >
                          View brand
                        </Link>
                      )}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Logo</Label>
                  <ImageInput
                    value={form.logo_url}
                    onChange={(url) =>
                      setForm((p) => ({ ...p, logo_url: url }))
                    }
                    uploadType="brands"
                    previewClass="h-32"
                    urlPlaceholder="https://.../logo.png"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Background</Label>
                  <ImageInput
                    value={form.background_image}
                    onChange={(url) =>
                      setForm((p) => ({ ...p, background_image: url }))
                    }
                    uploadType="brands"
                    urlPlaceholder="https://.../background.jpg"
                  />
                </div>

                <div className="space-y-3 rounded-lg border border-[#ebeef0] p-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label>Brand Colors</Label>
                      {colorsLoading && (
                        <span className="inline-flex items-center gap-1 text-xs text-brand">
                          <Loader2Icon className="size-3.5 animate-spin" />
                          Analyzing…
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#a7abc3]">
                      Auto-generated from your logo or website. Regenerate any
                      time, then fine-tune. Used to theme campaigns and
                      AI-generated images.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => generateColors("logo")}
                        disabled={
                          colorsLoading || saving || !form.logo_url.trim()
                        }
                        className="gap-1.5"
                      >
                        <SparklesIcon className="size-4 text-brand" />
                        From logo
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => generateColors("website")}
                        disabled={colorsLoading || saving || !form.url.trim()}
                        className="gap-1.5"
                      >
                        <SparklesIcon className="size-4 text-brand" />
                        From website
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => generateColors("surprise")}
                        disabled={colorsLoading || saving}
                        className="gap-1.5"
                      >
                        <SparklesIcon className="size-4 text-brand" />
                        Surprise me
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                    {COLOR_ROLES.map(({ key, label }) => {
                      const val = brandColors[key] || "";
                      return (
                        <div key={key} className="space-y-1.5">
                          <span className="block text-xs font-medium text-[#575962]">
                            {label}
                          </span>
                          <div className="flex items-center gap-2 rounded-md border border-[#ebeef0] p-1.5">
                            <input
                              type="color"
                              value={
                                /^#[0-9a-fA-F]{6}$/.test(val) ? val : "#ffffff"
                              }
                              onChange={(e) =>
                                setBrandColors((p) => ({
                                  ...p,
                                  [key]: e.target.value,
                                }))
                              }
                              className="size-8 shrink-0 cursor-pointer rounded border-0 bg-transparent p-0"
                              aria-label={`${label} color`}
                              disabled={saving}
                            />
                            <input
                              value={val}
                              onChange={(e) =>
                                setBrandColors((p) => ({
                                  ...p,
                                  [key]: e.target.value,
                                }))
                              }
                              placeholder="#000000"
                              className="w-full min-w-0 bg-transparent text-xs uppercase text-[#575962] outline-none"
                              disabled={saving}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {colorsMood && (
                    <p className="text-xs text-[#a7abc3]">Mood: {colorsMood}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    rows={5}
                    value={form.description}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, description: e.target.value }))
                    }
                    disabled={saving}
                  />
                </div>

                <SlugAvailabilityField
                  value={form.slug}
                  onChange={(slug) => setForm((p) => ({ ...p, slug }))}
                  availability={slugAvailability}
                  label="Public page address *"
                  hint="E.g: referrals"
                  disabled={saving}
                />

                {publicPath && slugAvailability.status !== "taken" ? (
                  <div className="min-w-0 rounded-md border border-[#28a745]/30 bg-[#28a745]/5 px-4 py-3 text-sm text-[#575962]">
                    View public brand page here{" "}
                    <a
                      href={publicPath}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex max-w-full items-center gap-1 break-all font-semibold text-brand hover:underline"
                    >
                      {publicPath}
                      <ExternalLinkIcon className="size-3 shrink-0" />
                    </a>
                  </div>
                ) : (
                  <div className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm font-medium text-destructive">
                    Pick an available address to view the public brand page
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button
                    type="submit"
                    disabled={saving || slugBlocked}
                    title={
                      slugBlocked
                        ? "Pick an available public address first"
                        : undefined
                    }
                    className="bg-brand hover:bg-brand-hover"
                  >
                    {saving ? "Saving..." : "Submit"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => loadBrand()}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="social" className="p-6">
              <form
                onSubmit={handleSocialSubmit}
                className="mx-auto max-w-2xl space-y-5"
              >
                <div>
                  <h3 className="text-lg font-semibold text-[#575962]">
                    Social Media{" "}
                    <span className="text-sm font-normal text-[#36a3f7]">
                      (OPTIONAL)
                    </span>
                  </h3>
                </div>
                {SOCIAL_FIELDS.map(({ key, label, help }) => (
                  <div key={key} className="space-y-2">
                    <Label htmlFor={key}>{label}</Label>
                    <Input
                      id={key}
                      value={socials[key]}
                      onChange={(e) =>
                        setSocials((p) => ({ ...p, [key]: e.target.value }))
                      }
                      disabled={saving}
                    />
                    <p className="text-xs text-[#a7abc3]">{help}</p>
                  </div>
                ))}
                <div className="flex gap-2 pt-2">
                  <Button
                    type="submit"
                    disabled={saving}
                    className="bg-brand hover:bg-brand-hover"
                  >
                    {saving ? "Saving..." : "Submit"}
                  </Button>
                </div>
              </form>
            </TabsContent>

            {isPremium && (
              <TabsContent value="whitelabel" className="p-6">
                <div className="mx-auto max-w-2xl space-y-4 text-sm text-[#575962]">
                  <p>
                    Configure a custom domain and whitelabel settings for this
                    brand&apos;s referral campaigns.
                  </p>
                  <Link href={`/brands/${brandId}/subdomain`}>
                    <Button className="gap-2 bg-brand hover:bg-brand-hover">
                      Open Whitelabel Settings
                    </Button>
                  </Link>
                </div>
              </TabsContent>
            )}
          </Tabs>
        </div>

        <aside className="portlet p-5">
          <h3 className="font-bold text-[#575962]">To Do</h3>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link
                href={`/brands/${brandId}/campaigns`}
                className="flex items-center gap-2 text-[#575962] hover:text-brand"
              >
                <LayoutDashboardIcon className="size-4 text-brand" />
                All Campaigns
              </Link>
            </li>
            <li>
              <Link
                href={`/brands/${brandId}/campaigns/new`}
                className="flex items-center gap-2 text-[#575962] hover:text-brand"
              >
                <PlusIcon className="size-4 text-brand" />
                Add Campaign
              </Link>
            </li>
            <li>
              <Link
                href={`/brands/${brandId}`}
                className="flex items-center gap-2 text-[#575962] hover:text-brand"
              >
                <BarChart3Icon className="size-4 text-brand" />
                Brand Stats
              </Link>
            </li>
            <li>
              <Link
                href="/billing"
                className="flex items-center gap-2 text-[#575962] hover:text-brand"
              >
                <CreditCardIcon className="size-4 text-brand" />
                Upgrade to Premium
              </Link>
            </li>
          </ul>
        </aside>
      </div>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this brand?</DialogTitle>
            <DialogDescription>
              This will permanently delete {brand.domain}, its campaigns, and
              social links. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleting}
              onClick={handleDelete}
            >
              {deleting ? "Deleting..." : "Yes, delete it"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
