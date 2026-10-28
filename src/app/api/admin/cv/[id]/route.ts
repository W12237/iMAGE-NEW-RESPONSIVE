import { NextRequest, NextResponse } from "next/server";
import { getAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { readFile } from "fs/promises";
import path from "path";
import { existsSync } from "fs";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdmin();
  if (!admin) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { id } = await params;
  const application = await prisma.careerApplication.findUnique({
    where: { id },
  });

  if (!application) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const filename = path.basename(application.cvUrl);
  const filePath = path.join(process.cwd(), "private-storage", "cvs", filename);

  if (!existsSync(filePath)) {
    return new NextResponse("File Not Found", { status: 404 });
  }

  try {
    const fileBuffer = await readFile(filePath);
    const ext = path.extname(application.cvFilename).toLowerCase();
    let contentType = "application/octet-stream";
    if (ext === ".pdf") contentType = "application/pdf";
    else if (ext === ".doc") contentType = "application/msword";
    else if (ext === ".docx") {
      contentType =
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    }

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${encodeURIComponent(
          application.cvFilename
        )}"`,
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
      },
    });
  } catch {
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
