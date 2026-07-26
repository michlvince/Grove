"use client";

import React, { useEffect, useState, useRef } from "react";
import { MessageSquare, Send, User, RefreshCw, Sparkles, Check, CheckCheck } from "lucide-react";
import type { DirectMessage } from "@/types/collaboration";

interface CommunityUser {
  id: string;
  name: string;
  email: string;
  title: string;
  role?: string;
  image?: string | null;
}

export default function DirectMessagesPage() {
  const [users, setUsers] = useState<CommunityUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<CommunityUser | null>(null);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Load community members list
  const loadUsers = async () => {
    setLoadingUsers(true);
    const res = await fetch("/api/users", { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      setUsers(data.users ?? []);
    }
    setLoadingUsers(false);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // Load conversation messages when partner selected
  const loadConversation = async (partnerId: string) => {
    setLoadingMessages(true);
    const res = await fetch(`/api/messages?partnerId=${partnerId}`, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      setMessages(data.messages ?? []);
    }
    setLoadingMessages(false);
  };

  useEffect(() => {
    if (selectedUser) {
      loadConversation(selectedUser.id);
    }
  }, [selectedUser]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !newMessage.trim()) return;

    setSending(true);
    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        receiverId: selectedUser.id,
        message: newMessage.trim(),
      }),
    });

    if (res.ok) {
      const data = await res.json();
      setMessages((prev) => [...prev, data.message]);
      setNewMessage("");
    }
    setSending(false);
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col md:flex-row rounded-3xl border border-border bg-surface overflow-hidden shadow-xl animate-fade-in">
      {/* Users Sidebar */}
      <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-border bg-background/50 flex flex-col">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-emerald-400" />
            <h2 className="font-bold text-foreground text-sm">Direct Messages</h2>
          </div>
          <button
            onClick={loadUsers}
            className="p-1.5 rounded-lg border border-border bg-surface text-muted hover:text-foreground text-xs"
            title="Refresh Users"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingUsers ? "animate-spin" : ""}`} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {loadingUsers ? (
            <div className="p-6 text-center text-xs text-muted">Loading members...</div>
          ) : users.length === 0 ? (
            <div className="p-6 text-center text-xs text-muted">No other community members found yet.</div>
          ) : (
            users.map((u) => {
              const isSelected = selectedUser?.id === u.id;
              return (
                <button
                  key={u.id}
                  onClick={() => setSelectedUser(u)}
                  className={`w-full text-left p-3 rounded-2xl flex items-center gap-3 transition-premium ${
                    isSelected
                      ? "bg-emerald-950/40 border border-emerald-500/30 text-emerald-400"
                      : "hover:bg-surface-hover text-foreground border border-transparent"
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-emerald-950/80 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-xs shrink-0">
                    {u.name ? u.name.charAt(0).toUpperCase() : "U"}
                  </div>
                  <div className="truncate flex-1">
                    <div className="text-xs font-semibold truncate">{u.name}</div>
                    <div className="text-[10px] text-muted truncate">{u.title || u.email}</div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-surface">
        {selectedUser ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-border flex items-center justify-between glass-bezel">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-950/80 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-xs">
                  {selectedUser.name ? selectedUser.name.charAt(0).toUpperCase() : "U"}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">{selectedUser.name}</h3>
                  <p className="text-[10px] text-muted">{selectedUser.title} • {selectedUser.email}</p>
                </div>
              </div>

              <button
                onClick={() => loadConversation(selectedUser.id)}
                className="p-1.5 rounded-lg border border-border bg-background text-muted hover:text-foreground text-xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingMessages ? "animate-spin" : ""}`} />
              </button>
            </div>

            {/* Messages Thread */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-background/30">
              {loadingMessages ? (
                <div className="h-full flex items-center justify-center text-xs text-muted">
                  Loading conversation...
                </div>
              ) : messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center gap-2 text-center p-6">
                  <Sparkles className="w-6 h-6 text-emerald-400 opacity-60" />
                  <p className="text-xs text-muted">
                    No messages yet with <span className="font-semibold text-foreground">{selectedUser.name}</span>. Say hello!
                  </p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.senderId !== selectedUser.id;
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                    >
                      <div
                        className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-xs space-y-1 ${
                          isMe
                            ? "bg-emerald-600 text-white rounded-br-none shadow-sm"
                            : "bg-surface border border-border text-foreground rounded-bl-none"
                        }`}
                      >
                        <div>{msg.message}</div>
                        <div
                          className={`text-[9px] text-right ${
                            isMe ? "text-emerald-100/70" : "text-muted"
                          }`}
                        >
                          {new Date(msg.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Input Composer */}
            <form onSubmit={handleSendMessage} className="p-3 border-t border-border bg-surface flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={`Message ${selectedUser.name}...`}
                className="flex-1 bg-background border border-border rounded-xl px-4 py-2.5 text-xs text-foreground focus:outline-none focus:border-emerald-500/50"
              />
              <button
                type="submit"
                disabled={sending || !newMessage.trim()}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50 transition-all active:scale-[0.98]"
              >
                <Send className="w-3.5 h-3.5" />
                Send
              </button>
            </form>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center gap-3 p-8 text-center">
            <MessageSquare className="w-10 h-10 text-emerald-400 opacity-40" />
            <h3 className="text-base font-bold text-foreground">Your Messages</h3>
            <p className="text-xs text-muted max-w-sm">
              Select a community member from the sidebar to start a 1-on-1 private conversation.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
