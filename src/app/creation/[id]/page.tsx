"use client";

import React, { use, useState, useEffect, useRef, useCallback } from "react";
import { useAppState, Creation, DEFAULT_WORLDS, CreationStatus, Entry } from "@/context/StateContext";
import {
  ArrowLeft,
  Calendar,
  Image as ImageIcon,
  Link2,
  Send,
  Plus,
  MoreVertical,
  Check,
  Trash2,
  ExternalLink,
  ChevronDown,
  X,
  Mic,
  Upload,
  ZoomIn,
  Square,
  Users,
  UserPlus,
  MessageCircle,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ProductionTab from "@/components/features/ProductionTab";

interface PageProps {
  params: Promise<{ id: string }>;
}

// ─── Audio Player ─────────────────────────────────────────────────────────────
// Handles both real recorded audio (base64 data URLs) and simulated duration-only entries.
function AudioPlayer({ content }: { content: string }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const timerRef = useRef<any>(null);

  // Determine if content is a real audio data URL or a JSON metadata stub
  const isRealAudio = content.startsWith("data:audio");

  // For stub entries, parse the simulated duration
  let stubDuration = 10;
  if (!isRealAudio) {
    try {
      const parsed = JSON.parse(content);
      stubDuration = parsed.duration || 10;
    } catch (e) {
      // fallback
    }
  }

  // Create or destroy audio element for real audio
  useEffect(() => {
    if (!isRealAudio) return;

    const audio = new Audio(content);
    audio.preload = "metadata";
    audioRef.current = audio;

    // MediaRecorder WebM blobs often report duration as Infinity because the
    // stream has no duration metadata. Force the browser to compute the real
    // duration by seeking to the end, then resetting to the start.
    const fixInfiniteDuration = () => {
      if (audio.duration === Infinity || isNaN(audio.duration)) {
        const onSeeked = () => {
          audio.removeEventListener("seeked", onSeeked);
          audio.currentTime = 0;
          setTotalDuration(audio.duration);
        };
        audio.addEventListener("seeked", onSeeked);
        audio.currentTime = 1e101; // jump past the end to trigger duration calc
      } else {
        setTotalDuration(audio.duration);
      }
    };

    const onLoadedMetadata = () => fixInfiniteDuration();
    const onDurationChange = () => {
      if (audio.duration !== Infinity && !isNaN(audio.duration)) {
        setTotalDuration(audio.duration);
      }
    };
    const onTimeUpdate = () => {
      const dur = audio.duration;
      setCurrentTime(audio.currentTime);
      setProgress(dur && dur !== Infinity ? (audio.currentTime / dur) * 100 : 0);
    };
    const onEnded = () => {
      setIsPlaying(false);
      setProgress(0);
      setCurrentTime(0);
    };
    const onError = () => {
      console.error("Audio playback error:", audio.error);
      setIsPlaying(false);
    };

    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("durationchange", onDurationChange);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onError);

    return () => {
      audio.pause();
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("durationchange", onDurationChange);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onError);
    };
  }, [content, isRealAudio]);

  // Stub playback simulation
  useEffect(() => {
    if (isRealAudio) return;

    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setProgress((prev) => {
          const next = prev + 100 / (stubDuration * 10);
          if (next >= 100) {
            setIsPlaying(false);
            clearInterval(timerRef.current!);
            return 0;
          }
          return next;
        });
      }, 100);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, stubDuration, isRealAudio]);

  const togglePlay = () => {
    if (isRealAudio && audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => setIsPlaying(true))
            .catch((err) => {
              console.error("Unable to play audio:", err);
              setIsPlaying(false);
            });
        } else {
          setIsPlaying(true);
        }
      }
    } else {
      // Simulated stub playback
      setIsPlaying(!isPlaying);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isRealAudio || !audioRef.current) return;
    const dur = audioRef.current.duration;
    if (!dur || dur === Infinity || isNaN(dur)) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    audioRef.current.currentTime = ratio * dur;
    setProgress(ratio * 100);
  };

  const formatTime = (sec: number) => {
    if (isNaN(sec)) return "0:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const displayCurrent = isRealAudio ? currentTime : (progress / 100) * stubDuration;
  const displayTotal = isRealAudio ? totalDuration : stubDuration;

  const BAR_HEIGHTS = [4, 8, 12, 16, 12, 8, 4, 6, 10, 14, 18, 14, 10, 6, 8, 12, 16, 20, 16, 12, 8, 6, 10, 6, 4];

  return (
    <div className="flex items-center gap-3 bg-surface border border-border p-3 rounded-xl w-full">
      {/* Play/Pause Button */}
      <button
        onClick={togglePlay}
        className="w-8 h-8 rounded-full bg-emerald-500 hover:bg-emerald-400 active:scale-95 flex items-center justify-center text-[#090d16] transition-all shrink-0"
      >
        {isPlaying ? (
          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
            <rect x="4" y="4" width="4" height="16" />
            <rect x="16" y="4" width="4" height="16" />
          </svg>
        ) : (
          <svg className="w-3.5 h-3.5 fill-current translate-x-0.5" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>

      {/* Waveform + Time */}
      <div className="flex-1 space-y-1">
        <div className="flex items-center justify-between text-[9px] text-slate-500">
          <span className="font-semibold tracking-wider uppercase text-emerald-400">
            {isRealAudio ? "Voice Note" : "Audio Note"}
          </span>
          <span>
            {formatTime(displayCurrent)} / {formatTime(displayTotal)}
          </span>
        </div>

        {/* Waveform bars — also acts as seek bar */}
        <div
          className="relative h-6 flex items-center gap-0.5 cursor-pointer"
          onClick={handleSeek}
          title="Click to seek"
        >
          {BAR_HEIGHTS.map((h, i) => {
            const activeIndex = Math.floor((progress / 100) * BAR_HEIGHTS.length);
            const isActive = i <= activeIndex;
            return (
              <div
                key={i}
                className="w-[3px] rounded-full transition-all duration-100"
                style={{
                  height: `${h + 4}px`,
                  backgroundColor: isActive ? "#10b981" : "rgba(255,255,255,0.12)",
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Image Lightbox ────────────────────────────────────────────────────────────
function ImageLightbox({ src, onClose }: { src: string; onClose: () => void }) {
  // Close on backdrop click
  const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
      onClick={handleBackdrop}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-9 h-9 rounded-full bg-surface border border-border flex items-center justify-center text-muted hover:text-foreground hover:bg-surface-hover transition-all z-10"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Image */}
      <img
        src={src}
        alt="Full-screen view"
        className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl select-none"
        draggable={false}
      />
    </div>
  );
}

// ─── Mock preset images ────────────────────────────────────────────────────────
const MOCK_IMAGES = [
  { name: "Forest Canopy", url: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=500&auto=format&fit=crop&q=60" },
  { name: "Digital Moss", url: "https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=500&auto=format&fit=crop&q=60" },
  { name: "Obsidian Vibe", url: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=500&auto=format&fit=crop&q=60" },
  { name: "Clear Stream", url: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=500&auto=format&fit=crop&q=60" },
];

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CreationDetail({ params }: PageProps) {
  const resolvedParams = use(params);
  const creationId = resolvedParams.id;
  const router = useRouter();

  const { creations, updateCreationStatus, addEntry, deleteCreation } = useAppState();

  const [activeTab, setActiveTab] = useState<"timeline" | "production" | "chat">("timeline");
  const [creationMode, setCreationMode] = useState<"personal" | "team">("personal");
  const [members, setMembers] = useState<any[]>([]);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);

  // Project chat state
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [newChatMessage, setNewChatMessage] = useState("");
  const [loadingChat, setLoadingChat] = useState(false);
  const [sendingChat, setSendingChat] = useState(false);

  const loadMembers = useCallback(async () => {
    const res = await fetch(`/api/creations/${creationId}/members`, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      setMembers(data.members ?? []);
    }
  }, [creationId]);

  const loadAvailableUsers = async () => {
    const res = await fetch("/api/users", { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      setAvailableUsers(data.users ?? []);
    }
  };

  const loadProjectChat = useCallback(async () => {
    setLoadingChat(true);
    const res = await fetch(`/api/creations/${creationId}/chat`, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      setChatMessages(data.messages ?? []);
    }
    setLoadingChat(false);
  }, [creationId]);

  useEffect(() => {
    if (creation) {
      setCreationMode(creation.mode ?? "personal");
      loadMembers();
    }
  }, [creation, loadMembers]);

  useEffect(() => {
    if (activeTab === "chat") {
      loadProjectChat();
    }
  }, [activeTab, loadProjectChat]);

  const toggleMode = async () => {
    const newMode = creationMode === "personal" ? "team" : "personal";
    setCreationMode(newMode);
    await fetch(`/api/creations/${creationId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "updateMode", mode: newMode }),
    });
  };

  const addCollaborator = async (userId: string) => {
    const res = await fetch(`/api/creations/${creationId}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, role: "member" }),
    });
    if (res.ok) {
      loadMembers();
    }
  };

  const removeCollaborator = async (userId: string) => {
    const res = await fetch(`/api/creations/${creationId}/members?userId=${userId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      loadMembers();
    }
  };

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChatMessage.trim()) return;

    setSendingChat(true);
    const res = await fetch(`/api/creations/${creationId}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: newChatMessage.trim() }),
    });

    if (res.ok) {
      const data = await res.json();
      setChatMessages((prev) => [...prev, data.message]);
      setNewChatMessage("");
    }
    setSendingChat(false);
  };

  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showAttachDrawer, setShowAttachDrawer] = useState(false);
  const timelineEndRef = useRef<HTMLDivElement>(null);

  // Lightbox
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  // Voice Recording States
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const recordingTimerRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // MediaRecorder for real audio capture
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Recording timer counter
  useEffect(() => {
    if (isRecording) {
      setRecordSeconds(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    }
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    };
  }, [isRecording]);

  // Start recording — requests mic permission and begins MediaRecorder
  const handleStartRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      audioChunksRef.current = [];

      // Pick a mime type the browser actually supports so the recorded blob
      // and the stored data URL agree on format.
      const preferredTypes = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/ogg;codecs=opus",
        "audio/mp4",
      ];
      const mimeType =
        preferredTypes.find(
          (t) =>
            typeof MediaRecorder !== "undefined" &&
            MediaRecorder.isTypeSupported(t)
        ) || "";

      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.start(100); // collect every 100ms
      setIsRecording(true);
    } catch (err) {
      // Mic permission denied or not available — fall back to simulated mode
      console.warn("Microphone access denied, using simulated recording:", err);
      setIsRecording(true); // still show the recording UI
    }
  }, []);

  // Upload a base64 data URL (image/audio) to Cloudinary via our API route,
  // returning the hosted URL. Falls back to the raw data URL if the upload fails
  // so the entry is still captured locally.
  const uploadMedia = useCallback(
    async (dataUrl: string, resourceType: "image" | "video"): Promise<string> => {
      try {
        const res = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data: dataUrl, resourceType }),
        });
        if (!res.ok) return dataUrl;
        const json = await res.json();
        return json.url || dataUrl;
      } catch {
        return dataUrl;
      }
    },
    []
  );

  // Stop recording — finalise audio blob and store via Cloudinary
  const handleStopRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;

    if (recorder && recorder.state !== "inactive") {
      recorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        const reader = new FileReader();
        reader.onloadend = async () => {
          const dataUrl = reader.result as string;
          const url = await uploadMedia(dataUrl, "video");
          addEntry(creationId, "audio", url);
        };
        reader.readAsDataURL(blob);

        // Stop all tracks
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        mediaRecorderRef.current = null;
      };
      recorder.stop();
    } else {
      // Simulated fallback — store duration stub
      const duration = recordSeconds || 5;
      addEntry(creationId, "audio", JSON.stringify({ duration, id: Math.random().toString(36).substring(7) }));
    }

    setIsRecording(false);
    setShowAttachDrawer(false);
  }, [addEntry, creationId, recordSeconds, uploadMedia]);

  // Image from camera roll — upload to Cloudinary, then store the hosted URL
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      const url = await uploadMedia(base64String, "image");
      addEntry(creationId, "image", url);
      setShowAttachDrawer(false);
    };
    reader.readAsDataURL(file);
  };

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const creation = creations.find((c) => c.id === creationId);

  useEffect(() => {
    if (creation?.entries) {
      timelineEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [creation?.entries]);

  if (!mounted) return null;

  if (!creation) {
    return (
      <div className="py-8 text-center space-y-4">
        <p className="text-sm text-slate-400">Creation not found in ecosystem.</p>
        <Link
          href="/"
          className="px-4 py-2 bg-surface border border-border text-xs text-muted rounded-xl"
        >
          Go Home
        </Link>
      </div>
    );
  }

  const world = DEFAULT_WORLDS.find((w) => w.id === creation.worldId);

  const handleAddTextEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const isUrl = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\\/\w .-]*)*\/?$/.test(inputText.trim());

    if (isUrl) {
      let formattedUrl = inputText.trim();
      if (!/^https?:\/\//i.test(formattedUrl)) {
        formattedUrl = `https://${formattedUrl}`;
      }
      addEntry(creationId, "link", formattedUrl);
    } else {
      addEntry(creationId, "text", inputText.trim());
    }

    setInputText("");
  };

  const handleAddImageEntry = (url: string) => {
    addEntry(creationId, "image", url);
    setShowAttachDrawer(false);
  };

  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete "${creation.title}"?`)) {
      deleteCreation(creationId);
      router.push(creation.worldId === "dump" ? "/dump" : `/world/${creation.worldId}`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Seed":     return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
      case "Growing":  return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "Thriving": return "bg-purple-500/10 text-purple-500 border-purple-500/20";
      case "Launching":return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      case "Shipped":  return "bg-surface text-muted border-border";
      default:         return "bg-surface text-muted border-border";
    }
  };

  const statuses: CreationStatus[] = ["Seed", "Growing", "Thriving", "Launching", "Shipped"];

  return (
    <>
      {/* ── Image Lightbox Overlay ─────────────────────────────── */}
      {lightboxSrc && (
        <ImageLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
      )}

      <div className="flex flex-col flex-1 h-[calc(100vh-10rem)] relative overflow-hidden pb-16 max-w-3xl mx-auto w-full">

        {/* ── Detail Header ─────────────────────────────────────── */}
        <div className="flex items-center justify-between border-b border-border pb-3 shrink-0">
          <div className="flex items-center gap-3">
            <Link
              href={creation.worldId === "dump" ? "/dump" : `/world/${creation.worldId}`}
              className="p-2 bg-surface border border-border text-muted hover:text-foreground rounded-full transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>

            <div className="space-y-0.5">
              <span className="text-[9px] font-bold text-muted uppercase tracking-wider block">
                {world?.name || "The Dump"}
              </span>
              <h2 className="text-sm font-bold text-foreground truncate max-w-[160px]">
                {creation.title}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 relative">
            {/* Mode Badge (Personal / Team) */}
            <button
              onClick={toggleMode}
              className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border flex items-center gap-1 transition-all ${
                creationMode === "team"
                  ? "bg-violet-950/50 border-violet-500/40 text-violet-300"
                  : "bg-surface border-border text-muted"
              }`}
              title="Click to toggle Personal / Team Mode"
            >
              <Users className="w-3 h-3" />
              {creationMode === "team" ? "Team Mode" : "Personal"}
            </button>

            {/* Collaborators Button (for Team Mode) */}
            {creationMode === "team" && (
              <button
                onClick={() => {
                  loadAvailableUsers();
                  setShowMembersModal(true);
                }}
                className="p-1.5 rounded-full border border-border bg-surface text-muted hover:text-emerald-400 transition-colors"
                title="Manage Team Members"
              >
                <UserPlus className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Status Badge */}
            <button
              onClick={() => setShowStatusDropdown(!showStatusDropdown)}
              className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border flex items-center gap-1.5 transition-all ${getStatusColor(creation.status)}`}
            >
              {creation.status}
              <ChevronDown className="w-3 h-3" />
            </button>

            {showStatusDropdown && (
              <div className="absolute top-full right-0 mt-1.5 bg-surface border border-border rounded-xl shadow-2xl z-20 overflow-hidden min-w-[120px]">
                {statuses.map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      updateCreationStatus(creationId, s);
                      setShowStatusDropdown(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-foreground hover:bg-surface-hover flex items-center justify-between"
                  >
                    {s}
                    {creation.status === s && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                  </button>
                ))}
              </div>
            )}

            {/* Menu */}
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 text-muted hover:text-foreground transition-colors"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            {showMenu && (
              <div className="absolute top-full right-0 mt-1.5 bg-surface border border-border rounded-xl shadow-2xl z-20 overflow-hidden min-w-[140px]">
                <button
                  onClick={handleDelete}
                  className="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-surface-hover flex items-center gap-2"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Idea</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Tab Switcher ───────────────────────────────────────── */}
        <div className="flex bg-surface border border-border p-1 rounded-xl mt-1 gap-1">
          <button
            onClick={() => setActiveTab("timeline")}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-premium ${
              activeTab === "timeline"
                ? "bg-background text-emerald-400 border border-border"
                : "text-muted hover:text-foreground"
            }`}
          >
            Timeline
          </button>
          <button
            onClick={() => setActiveTab("production")}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-premium ${
              activeTab === "production"
                ? "bg-background text-emerald-400 border border-border"
                : "text-muted hover:text-foreground"
            }`}
          >
            Production
          </button>
          <button
            onClick={() => setActiveTab("chat")}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-premium flex items-center justify-center gap-1.5 ${
              activeTab === "chat"
                ? "bg-background text-emerald-400 border border-border"
                : "text-muted hover:text-foreground"
            }`}
          >
            <MessageCircle className="w-3.5 h-3.5" />
            Project Chat
          </button>
        </div>

        {activeTab === "production" && <ProductionTab creationId={creationId} />}

        {/* ── Project Group Chat Tab ──────────────────────────────── */}
        {activeTab === "chat" && (
          <div className="flex-1 flex flex-col my-3 border border-border rounded-2xl bg-surface overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-background/30">
              {loadingChat ? (
                <div className="text-center py-8 text-xs text-muted">Loading project messages...</div>
              ) : chatMessages.length === 0 ? (
                <div className="text-center py-12 space-y-2">
                  <MessageCircle className="w-6 h-6 text-emerald-400 mx-auto opacity-60" />
                  <p className="text-xs text-muted">No group chat messages yet. Start collaborating!</p>
                </div>
              ) : (
                chatMessages.map((msg) => (
                  <div key={msg.id} className="p-3 rounded-xl bg-background border border-border/50 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-emerald-400">{msg.user?.name || "Collaborator"}</span>
                      <span className="text-[9px] text-muted">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <div className="text-foreground">{msg.message}</div>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleSendChatMessage} className="p-2 border-t border-border bg-surface flex gap-2">
              <input
                type="text"
                value={newChatMessage}
                onChange={(e) => setNewChatMessage(e.target.value)}
                placeholder="Discuss project tasks..."
                className="flex-1 bg-background border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-emerald-500/50"
              />
              <button
                type="submit"
                disabled={sendingChat || !newChatMessage.trim()}
                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                Send
              </button>
            </form>
          </div>
        )}


        {/* ── Timeline Content ───────────────────────────────────── */}
        {activeTab === "timeline" && (
        <div className="flex-1 overflow-y-auto py-4 pr-1 space-y-4 no-scrollbar">
          {creation.entries.length === 0 ? (
            <div className="py-16 text-center space-y-2">
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full glow-emerald inline-block" />
              <p className="text-xs text-muted font-medium">Seed planted.</p>
              <p className="text-[10px] text-muted max-w-[200px] mx-auto leading-relaxed">
                Add text notes, project links, or attach designs below to help this idea grow.
              </p>
            </div>
          ) : (
            <div className="space-y-4 relative pl-3 border-l border-border">
              {creation.entries.map((entry) => {
                const date = new Date(entry.timestamp);
                const timeString = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

                return (
                  <div key={entry.id} className="relative space-y-1.5 animate-fade-in">
                    {/* Timeline bullet */}
                    <div className="absolute -left-[16.5px] top-1.5 w-2 h-2 rounded-full bg-background border border-primary/50" />

                    {/* Entry Bubble */}
                    <div className="bg-surface/50 border border-border rounded-2xl p-3.5 space-y-1.5">
                      <div className="flex items-center justify-between text-[9px] text-muted">
                        <span className="font-semibold uppercase tracking-wider">
                          {entry.type === "audio" ? "Voice Note" : `${entry.type} note`}
                        </span>
                        <span>{timeString}</span>
                      </div>

                      {/* ── Text ── */}
                      {entry.type === "text" && (
                        <p className="text-xs text-foreground leading-relaxed break-words whitespace-pre-wrap">
                          {entry.content}
                        </p>
                      )}

                      {/* ── Image ── tap to open lightbox ── */}
                      {entry.type === "image" && (
                        <div className="space-y-1.5">
                          <button
                            onClick={() => setLightboxSrc(entry.content)}
                            className="relative group w-full rounded-lg overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                            title="Tap to view full-screen"
                          >
                            <img
                              src={entry.content}
                              alt="Attached concept"
                              className="w-full max-h-48 object-cover rounded-lg border border-border transition-all group-hover:brightness-75"
                              draggable={false}
                            />
                            {/* Expand hint */}
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="bg-black/60 rounded-full p-2">
                                <ZoomIn className="w-4 h-4 text-white" />
                              </div>
                            </div>
                          </button>
                          <p className="text-[10px] text-muted italic">Tap image to view full screen</p>
                        </div>
                      )}

                      {/* ── Link ── */}
                      {entry.type === "link" && (
                        <a
                          href={entry.content}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2.5 bg-background hover:bg-surface border border-border rounded-xl flex items-center justify-between gap-3 text-xs text-emerald-400 group/link transition-colors"
                        >
                          <span className="truncate underline font-medium">{entry.content}</span>
                          <ExternalLink className="w-3.5 h-3.5 text-muted group-hover/link:text-emerald-400 transition-colors shrink-0" />
                        </a>
                      )}

                      {/* ── Audio ── */}
                      {entry.type === "audio" && (
                        <AudioPlayer content={entry.content} />
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={timelineEndRef} />
            </div>
          )}
        </div>
        )}

        {/* ── Attach Drawer ──────────────────────────────────────── */}
        {showAttachDrawer && (
          <div className="absolute bottom-16 left-0 right-0 bg-surface border border-border rounded-2xl p-4 shadow-2xl z-30 animate-scale-in space-y-3">
            {isRecording ? (
              /* Recording in progress */
              <div className="py-4 flex flex-col items-center justify-center gap-3 animate-fade-in text-center">
                <div className="relative flex items-center justify-center">
                  <span className="w-10 h-10 rounded-full bg-red-950 border border-red-500/20 flex items-center justify-center">
                    <span className="w-3.5 h-3.5 bg-red-500 rounded-full animate-ping absolute" />
                    <span className="w-3 h-3 bg-red-500 rounded-full" />
                  </span>
                </div>

                <div className="space-y-0.5">
                  <span className="text-xs font-semibold text-foreground">Recording Voice Note</span>
                  <span className="text-xl font-bold text-red-400 block font-mono">{formatDuration(recordSeconds)}</span>
                </div>

                <div className="flex gap-2 w-full max-w-[200px] mt-1">
                  <button
                    type="button"
                    onClick={() => {
                      // Cancel without saving
                      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
                        mediaRecorderRef.current.ondataavailable = null;
                        mediaRecorderRef.current.onstop = null;
                        mediaRecorderRef.current.stop();
                      }
                      streamRef.current?.getTracks().forEach((t) => t.stop());
                      streamRef.current = null;
                      mediaRecorderRef.current = null;
                      setIsRecording(false);
                    }}
                    className="flex-1 py-2 bg-background border border-border text-[10px] text-muted font-medium rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleStopRecording}
                    className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-[10px] text-white font-semibold rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950/20"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Save Note</span>
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between border-b border-border pb-2">
                  <span className="text-[10px] uppercase font-bold text-muted tracking-wider">
                    Add Attachment
                  </span>
                  <button onClick={() => setShowAttachDrawer(false)} className="text-muted hover:text-foreground">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Primary Actions */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="py-3 bg-background hover:bg-surface-hover rounded-xl border border-border text-xs text-foreground font-semibold flex items-center justify-center gap-2 group transition-colors"
                  >
                    <Upload className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                    <span>Camera Roll</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleStartRecording}
                    className="py-3 bg-background hover:bg-surface-hover rounded-xl border border-border text-xs text-foreground font-semibold flex items-center justify-center gap-2 group transition-colors"
                  >
                    <Mic className="w-4 h-4 text-red-400 group-hover:scale-110 transition-transform" />
                    <span>Voice Note</span>
                  </button>
                </div>

                {/* Divider */}
                <div className="flex items-center gap-2 py-0.5 text-[9px] uppercase font-bold text-muted">
                  <span className="border-t border-border flex-1" />
                  <span>Or Preset Concepts</span>
                  <span className="border-t border-border flex-1" />
                </div>

                {/* Preset Images */}
                <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto no-scrollbar">
                  {MOCK_IMAGES.map((img) => (
                    <button
                      key={img.name}
                      type="button"
                      onClick={() => handleAddImageEntry(img.url)}
                      className="p-2 bg-background hover:bg-surface-hover rounded-xl border border-border text-left space-y-1.5 group transition-all"
                    >
                      <img src={img.url} className="w-full h-10 object-cover rounded-lg" alt="" />
                      <span className="text-[9px] text-foreground block truncate group-hover:text-emerald-400 font-semibold">
                        {img.name}
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageUpload}
          accept="image/*"
          className="hidden"
        />

        {/* ── Composer Bar ───────────────────────────────────────── */}
        <form
          onSubmit={handleAddTextEntry}
          className="absolute bottom-0 left-0 right-0 flex items-center gap-2 py-2 shrink-0 border-t border-border bg-surface z-20"
        >
          {/* Attachment Button */}
          <button
            type="button"
            onClick={() => setShowAttachDrawer(!showAttachDrawer)}
            className={`p-2.5 rounded-xl border active:scale-95 transition-premium ${
              showAttachDrawer
                ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)]"
                : "bg-background border-border text-muted hover:text-foreground"
            }`}
            title="Add attachment"
          >
            <ImageIcon className="w-4 h-4" />
          </button>

          {/* Text Input */}
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Add text note or paste a URL link..."
            className="flex-1 bg-background border border-border focus:border-[#7FE08A]/40 focus:ring-4 focus:ring-emerald-500/10 rounded-xl py-2.5 px-3.5 text-foreground text-xs focus:outline-none transition-premium"
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="p-2.5 bg-emerald-600 hover:bg-emerald-500 hover:scale-[1.02] active:scale-95 disabled:opacity-40 disabled:pointer-events-none text-white rounded-xl flex items-center justify-center transition-premium shadow-md shadow-emerald-950/20"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

        {/* ── Team Collaborators Manager Modal ───────────────────────── */}
        {showMembersModal && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-surface border border-border rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-fade-in">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-400" />
                  <h3 className="font-bold text-foreground text-sm">Project Collaborators</h3>
                </div>
                <button onClick={() => setShowMembersModal(false)} className="text-muted hover:text-foreground text-xs p-1">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Current Collaborators */}
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-bold text-muted tracking-wider block">
                  Assigned Team Members ({members.length})
                </span>
                {members.length === 0 ? (
                  <p className="text-xs text-muted py-2">No team members assigned yet.</p>
                ) : (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {members.map((m) => (
                      <div key={m.id} className="flex items-center justify-between p-2 rounded-xl bg-background border border-border text-xs">
                        <div>
                          <div className="font-semibold text-foreground">{m.user?.name}</div>
                          <div className="text-[10px] text-muted">{m.user?.email}</div>
                        </div>
                        <button
                          onClick={() => removeCollaborator(m.user_id)}
                          className="text-red-400 hover:text-red-300 text-[10px] font-semibold px-2 py-1 rounded bg-red-950/20 border border-red-900/30"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add New Collaborator */}
              <div className="space-y-2 pt-2 border-t border-border">
                <span className="text-[10px] uppercase font-bold text-muted tracking-wider block">
                  Add Member to Project
                </span>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {availableUsers
                    .filter((u) => !members.some((m) => m.user_id === u.id))
                    .map((u) => (
                      <div key={u.id} className="flex items-center justify-between p-2 rounded-xl bg-background border border-border/50 text-xs">
                        <div>
                          <div className="font-medium text-foreground">{u.name}</div>
                          <div className="text-[10px] text-muted">{u.email}</div>
                        </div>
                        <button
                          onClick={() => addCollaborator(u.id)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-semibold rounded-lg flex items-center gap-1"
                        >
                          <UserPlus className="w-3 h-3" /> Assign
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

