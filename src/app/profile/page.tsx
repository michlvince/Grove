"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Image as ImageIcon, Upload, Check } from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");

  // Load user data
  useEffect(() => {
    async function loadUser() {
      setLoading(true);
      try {
        const res = await fetch("/api/profile", { credentials: "include" });
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setUser(data.user);
        setAvatarUrl(data.user?.image || "");
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, []);

  // Update avatar
  async function updateAvatar() {
    if (!avatarUrl) return;
    setLoading(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: avatarUrl }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update");
      const data = await res.json();
      setUser(data.user);
      setAvatarUrl(data.user.image);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  // Handle file upload
  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }
    setUploading(true);
    // Convert to base64
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const b64 = reader.result as string;
        resolve(b64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    // Upload to cloudinary via our upload endpoint
    try {
      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: base64, resourceType: "image" }),
        credentials: "include",
      });
      if (!uploadRes.ok) throw new Error("Upload failed");
      const uploadData = await uploadRes.json();
      const url = uploadData.url;
      setAvatarUrl(url);
      setPreviewUrl(url);
    } catch (err) {
      console.error(err);
      alert("Upload error");
    } finally {
      setUploading(false);
    }
    // Clear file input
    e.target.value = "";
  }

  if (loading) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-background p-6">
      <h1 className="text-2xl font-bold mb-4">Profile</h1>
      {!user ? (
        <p>Error loading user data.</p>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <div className="relative">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Avatar"
                  className="w-24 h-24 rounded-full object-cover border-2 border-primary"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center">
                  <ImageIcon className="h-12 w-12 text-primary" />
                </div>
              )}
              {uploading && (
                <div className="absolute -bottom-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-medium text-white">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" opacity="0.25"></circle>
                    <circle cx="12" cy="12" r="7" opacity="0.7"></circle>
                    <path d="M12 4v-1m0 6v-1m0 6v-1m3-3l1.362 1.362m-5.724 0L5 12m12.724 0L19 12m-5.724 5.724L12.362 17.364m5.724-5.724l1.362-1.362"></path>
                  </svg>
                </div>
              )}
              <div className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 hover:bg-primary/30 cursor-pointer" onClick={() => document.getElementById("avatarUpload")?.click()}>
                <Upload className="h-5 w-5 text-primary" />
                <input
                  id="avatarUpload"
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={handleFileChange}
                />
              </div>
            </div>
            <div>
              <h2 className="font-bold">{user.name}</h2>
              <p className="text-muted">{user.title}</p>
              <p className="text-xs text-muted">@{user.email.split("@")[0]}</p>
            </div>
          </div>

          <div className="space-y-4">
            <label className="flex items-center space-x-2 text-sm font-medium">
              Avatar URL
              <input
                type="text"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                className="flex-1 border border-input bg-background px-3 py-2 rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
                disabled={uploading}
              />
            </label>
            <button
              onClick={updateAvatar}
              disabled={loading || !avatarUrl || uploading}
              className="w-full flex items-center justify-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save Avatar"}
            </button>
          </div>

          <div className="border-t pt-4">
            <h2 className="font-semibold mb-2">Account Info</h2>
            <p className="text-sm text-muted">Email: {user.email}</p>
            <p className="text-sm text-muted">Role: {user.role}</p>
            <p className="text-sm text-muted">User ID: {user.id}</p>
          </div>
        </div>
      )}
    </div>
  );
}