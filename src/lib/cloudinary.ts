import { v2 as cloudinary } from "cloudinary";

/**
 * Configure Cloudinary SDK lazily using credentials from environment.
 * Supports CLOUDINARY_URL or individual credentials.
 */
function ensureConfigured() {
  if (process.env.CLOUDINARY_URL) {
    cloudinary.config({
      cloudinary_url: process.env.CLOUDINARY_URL,
      secure: true,
    });
    return;
  }

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      "Missing Cloudinary config. Set CLOUDINARY_URL or NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET."
    );
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
}

export type CloudinaryResource = "image" | "video" | "auto" | "raw";

/**
 * Upload a base64 data URL, HTTPS URL, or raw buffer to Cloudinary and return the secure delivery URL.
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
