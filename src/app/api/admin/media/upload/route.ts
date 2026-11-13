import { NextResponse } from "next/server";
import { getAdmin } from "@/lib/session";
import { processAndStoreMedia } from "@/lib/storage";
import { revalidatePath } from "next/cache";
import type { MediaKind } from "@/lib/storage/types";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const admin = await getAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized. Admin authentication required." }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: "Please select a valid file to upload." }, { status: 400 });
    }

    const expectedKind = (formData.get("kind") as MediaKind) || undefined;
    const altEn = (formData.get("altEn") as string) || undefined;
    const altAr = (formData.get("altAr") as string) || undefined;
    const captionEn = (formData.get("captionEn") as string) || undefined;
    const captionAr = (formData.get("captionAr") as string) || undefined;
    const posterUrl = (formData.get("posterUrl") as string) || undefined;
    const focalPoint = (formData.get("focalPoint") as string) || undefined;

    const result = await processAndStoreMedia(file, expectedKind, {
      altEn,
      altAr,
      captionEn,
      captionAr,
      posterUrl,
      focalPoint,
    });

    if (result.error || !result.asset) {
      return NextResponse.json({ error: result.error || "Failed to process media file." }, { status: 400 });
    }

    revalidatePath("/admin/media");
    revalidatePath("/admin/projects");

    return NextResponse.json({
      success: true,
      asset: result.asset,
    });
  } catch (err: any) {
    console.error("Upload API error:", err);
    return NextResponse.json({ error: err.message || "An error occurred during file upload." }, { status: 500 });
  }
}

