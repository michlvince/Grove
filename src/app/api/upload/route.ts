import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { uploadToCloudinary } from "@/lib/cloudinary";

// Accept up to ~25MB of base64 payload (images + audio voice notes).
export const maxDuration = 60;

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const data = (body as { data?: string })?.data;
  const resourceType = ((body as { resourceType?: string })?.resourceType ?? "auto") as
    | "image"
    | "video"
    | "auto"
    | "raw";

  if (!data || typeof data !== "string") {
    return NextResponse.json({ error: "data (file) required" }, { status: 400 });
  }

  try {
    const url = await uploadToCloudinary(
      data,
      `grove/${session.user.id}`,
      resourceType
    );
    return NextResponse.json({ url });
  } catch (err) {
    console.error("[upload] cloudinary failed:", err);
    const message =
      err instanceof Error ? err.message : "Upload failed. Check Cloudinary configuration.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
