import { v2 as cloudinary } from "cloudinary";

let configured = false;

function ensureConfigured() {
  if (configured) return;
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      "Missing Cloudinary config. Set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET."
    );
  }

  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });
  configured = true;
}

export type CloudinaryResource = "image" | "video" | "auto" | "raw";

/**
 * Upload a base64 data URL (or raw buffer) to Cloudinary and return the secure
 * delivery URL. Used for images and audio captured in the app so we never store
 * large blobs in the database.
 */
export async function uploadToCloudinary(
  data: string | Buffer,
  folder: string,
  resourceType: CloudinaryResource = "auto"
): Promise<string> {
  ensureConfigured();

  const uploadable =
    typeof data === "string"
      ? data
      : `data:application/octet-stream;base64,${data.toString("base64")}`;

  const result = await cloudinary.uploader.upload(uploadable, {
    folder,
    resource_type: resourceType,
  });

  return result.secure_url;
}
