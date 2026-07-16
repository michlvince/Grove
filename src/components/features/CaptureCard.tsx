"use client";

import React, { useState, useRef, useEffect } from "react";
import { Plus, Send, Sparkles } from "lucide-react";
import CreateCreationModal from "./CreateCreationModal";

export default function CaptureCard() {
  const [content, setContent] = useState("");
  const [showModal, setShowModal] = useState(false);
  const prompts = [
  {
    title: "What's on your mind?",
    subtitle: "Capture before it fades.",
  },
  {
    title: "What's growing today?",
    subtitle: "Every big idea starts as a tiny seed.",
  },
  {
    title: "Too many tabs open?",
    subtitle: "Give your brain somewhere to breathe.",
  },
  {
    title: "What refuses to leave your head?",
    subtitle: "Let's keep it safe.",
  },
  {
    title: "Plant a thought.",
    subtitle: "Organize it later.",
  },
];

const [promptIndex, setPromptIndex] = useState(0);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-adjust textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [content]);

  useEffect(() => {
  const interval = setInterval(() => {
    setPromptIndex((prev) => (prev + 1) % prompts.length);
  }, 7000);

  return () => clearInterval(interval);
}, []);

  const handlePlusClick = () => {
    if (!content.trim()) return;
    setShowModal(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handlePlusClick();
    }
  };

 return (
  <>
    <div
      className={`
        relative
        rounded-2xl
        glass
        glass-bezel
        p-6
        transition-premium
        ${
          content.length > 0
            ? "border-[#7FE08A]/40 shadow-[0_0_35px_rgba(127,224,138,.08)]"
            : "border-border"
        }
      `}
    >
  <div
  className={`
absolute inset-0 rounded-2xl
pointer-events-none
opacity-0
transition-opacity duration-500

${content.length > 0 ? "opacity-100" : ""}
`}
>

<div className="absolute inset-0 rounded-2xl animate-pulse border border-[#7FE08A]/40" />

</div>
      <div className="flex flex-col gap-4">
  <div className="mb-6 min-h-[88px]">
  <h2
    key={promptIndex}
    className="text-[30px] font-normal tracking-[-0.04em] text-foreground animate-fade-in"
  >
    {prompts[promptIndex].title}
  </h2>

  <p
    key={`subtitle-${promptIndex}`}
    className="mt-2 text-[15px] text-muted animate-fade-in"
  >
    {prompts[promptIndex].subtitle}
  </p>
</div>

  <textarea
  ref={textareaRef}
  value={content}
  onChange={(e) => setContent(e.target.value)}
  onKeyDown={handleKeyDown}
  placeholder="An idea, observation, question, plan..."
  rows={4}
  className="
    w-full
    bg-surface
    border border-border
    focus:border-primary/40
    focus:ring-4
    focus:ring-emerald-500/10
    rounded-xl
    p-3
    text-[15px]
    leading-7
    text-foreground
    placeholder:text-[13px]
    placeholder:italic
    placeholder:text-muted/65
    focus:outline-none
    resize-none
    min-h-[120px]
    max-h-[220px]
    overflow-y-auto
    transition-premium
  "
/>
<div>
     <button
  onClick={handlePlusClick}
  disabled={!content.trim()}
  className={`
    h-11
    px-6
    rounded-full
    flex items-center gap-2
    text-[14px]
    transition-premium

    ${
      content.trim()
        ? "bg-primary text-[#0F1115] hover:scale-[1.03] active:scale-95 shadow-[0_4px_20px_rgba(127,224,138,0.2)]"
        : "bg-surface border border-border text-muted cursor-not-allowed"
    }
  `}
>
  <span>Plant</span>
  <Plus className="w-4 h-4" />
</button>
</div>

        <div className="flex items-center justify-between mt-2">
        </div>
      </div>
    </div>

    <CreateCreationModal
      ideaContent={content}
      isOpen={showModal}
      onClose={() => setShowModal(false)}
      onClearInput={() => setContent("")}
    />
  </>
);
}
