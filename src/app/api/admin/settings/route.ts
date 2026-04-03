import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { readFile, writeFile } from "fs/promises";
import { join } from "path";

const SETTINGS_FILE = join(process.cwd(), "data", "admin-settings.json");

interface PlatformSettings {
  siteName: string;
  maintenanceMode: boolean;
  registrationEnabled: boolean;
  defaultPlanId: number;
  supportEmail: string;
  maxBrandsPerMember: number;
  maxCampaignsPerBrand: number;
}

const DEFAULT_SETTINGS: PlatformSettings = {
  siteName: "Referrals.com",
  maintenanceMode: false,
  registrationEnabled: true,
  defaultPlanId: 0,
  supportEmail: "support@referrals.com",
  maxBrandsPerMember: 10,
  maxCampaignsPerBrand: 50,
};

async function loadSettings(): Promise<PlatformSettings> {
  try {
    const data = await readFile(SETTINGS_FILE, "utf-8");
    return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

async function saveSettings(settings: PlatformSettings): Promise<void> {
  const { mkdir } = await import("fs/promises");
  const dir = join(process.cwd(), "data");
  await mkdir(dir, { recursive: true });
  await writeFile(SETTINGS_FILE, JSON.stringify(settings, null, 2));
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const settings = await loadSettings();
    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const current = await loadSettings();
    const updated = { ...current, ...body };

    await saveSettings(updated);

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
