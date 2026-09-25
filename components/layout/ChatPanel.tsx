"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  MessageSquare, X, Send, ChevronLeft, Search,
  Circle, Minimize2, Maximize2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Therapist {
  id: string;
  name: string;
  specialty?: string | null;
  user_id?: string | null;
}

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string | null;
  room_id: string;
  message: string;
  is_read: boolean;
  admin_sender: boolean;
  created_at: string;
}

interface Props {
  currentTherapistId: string | null; // null = admin
  currentUserId: string;
  isAdmin: boolean;
  therapists: Therapist[];
  currentUserName: string;
  open: boolean;
  setOpen: (v: boolean) => void;
  onUnreadChange: (total: number) => void;
}

function getRoomId(a: string, b: string) {
  return [a, b].sort().join("_");
}

function getInitials(name: string) {
  return name
    .replace(/^Dr\.\s*/i, "")
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "?";
}

function timeLabel(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const isToday =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();
  if (isToday) {
    return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
  }
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

const AVATAR_COLORS: Record<string, string> = {};
const PALETTE = [
  "bg-amber-500", "bg-emerald-500", "bg-blue-500",
  "bg-violet-500", "bg-rose-500", "bg-teal-500", "bg-indigo-500",
];
function getAvatarColor(id: string) {
  if (!AVATAR_COLORS[id]) {
    AVATAR_COLORS[id] = PALETTE[Object.keys(AVATAR_COLORS).length % PALETTE.length];
  }
  return AVATAR_COLORS[id];
}

const ADMIN_SENTINEL = "admin";

export function ChatPanel({
  currentTherapistId,
  currentUserId,
  isAdmin,
  therapists,
  open,
  setOpen,
  onUnreadChange,
}: Props) {
  const [minimized, setMinimized] = useState(false);
  const [selectedContact, setSelectedContact] = useState<
    Therapist | { id: string; name: string; specialty: string } | null
  >(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState("");
  const [unreadMap, setUnreadMap] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Use a ref for activeRoomId so the realtime callback always has the latest value
  // without needing to re-subscribe
  const myId = isAdmin ? ADMIN_SENTINEL : (currentTherapistId || currentUserId || "");
  const activeRoomIdRef = useRef<string | null>(null);
  const seenMsgIds = useRef<Set<string>>(new Set());

  const activeRoomId = selectedContact ? getRoomId(myId, selectedContact.id) : null;
  activeRoomIdRef.current = activeRoomId;

  const contacts = isAdmin
    ? therapists.map((t) => ({ id: t.id, name: t.name, specialty: t.specialty }))
    : [
        { id: ADMIN_SENTINEL, name: "Clinic Admin", specialty: "Administration" },
        ...therapists.filter((t) => t.id !== currentTherapistId),
      ];

  const filtered = contacts.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 60);
  }, []);

  // Load messages when entering a room
  useEffect(() => {
    if (!activeRoomId) {
      setMessages([]);
      seenMsgIds.current.clear();
      return;
    }
    setError(null);
    const supabase = createClient();
    supabase
      .from("chat_messages")
      .select("*")
      .eq("room_id", activeRoomId)
      .order("created_at", { ascending: true })
      .limit(80)
      .then(({ data, error: err }) => {
        if (err) {
          console.error("Load messages error:", err);
          setError("Could not load messages.");
          return;
        }
        const msgs = (data ?? []) as Message[];
        msgs.forEach((m) => seenMsgIds.current.add(m.id));
        setMessages(msgs);
        scrollToBottom();
      });

    // Mark others' messages as read — client-side directly
    if (myId) {
      supabase
        .from("chat_messages")
        .update({ is_read: true })
        .eq("room_id", activeRoomId)
        .neq("sender_id", myId)
        .eq("is_read", false)
        .then(() => {});
      setUnreadMap((prev) => ({ ...prev, [activeRoomId]: 0 }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRoomId]);

  // Single persistent realtime subscription — uses ref to avoid stale closures
  useEffect(() => {
    if (!myId) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`chat_panel_${myId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages" },
        (payload) => {
          const msg = payload.new as Message;

          // Only care about rooms that include me
          const parts = msg.room_id.split("_");
          if (!parts.includes(myId)) return;

          // Dedup: skip if we've already shown this message
          if (seenMsgIds.current.has(msg.id)) return;
          seenMsgIds.current.add(msg.id);

          const currentRoomId = activeRoomIdRef.current;

          if (msg.room_id === currentRoomId) {
            setMessages((prev) => {
              // Replace a matching temp message if it exists
              const tempIdx = prev.findIndex(
                (m) =>
                  m.id.startsWith("temp-") &&
                  m.message === msg.message &&
                  m.sender_id === msg.sender_id &&
                  m.admin_sender === msg.admin_sender
              );
              if (tempIdx !== -1) {
                const next = [...prev];
                next[tempIdx] = msg;
                return next;
              }
              return [...prev, msg];
            });
            scrollToBottom();
            // mark as read since we're looking at this room
            supabase
              .from("chat_messages")
              .update({ is_read: true })
              .eq("room_id", msg.room_id)
              .neq("sender_id", myId)
              .eq("is_read", false)
              .then(() => {});
          } else {
            // Bump unread only for messages from the other person
            const fromOther = isAdmin ? !msg.admin_sender : msg.sender_id !== myId;
            if (fromOther) {
              setUnreadMap((prev) => ({
                ...prev,
                [msg.room_id]: (prev[msg.room_id] ?? 0) + 1,
              }));
            }
          }
        }
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR") {
          console.error("Chat realtime subscription error");
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myId]); // Only depends on myId — activeRoomId accessed via ref

  // Propagate total unread to parent
  useEffect(() => {
    const total = Object.values(unreadMap).reduce((a, b) => a + b, 0);
    onUnreadChange(total);
  }, [unreadMap, onUnreadChange]);

  // Reset on close
  useEffect(() => {
    if (!open) {
      setMinimized(false);
      setSelectedContact(null);
      setError(null);
    }
  }, [open]);

  const handleSend = async () => {
    if (!input.trim() || !selectedContact || !myId || sending) return;
    setSending(true);
    setError(null);

    const tempId = `temp-${Date.now()}`;
    const trimmedMessage = input.trim();
    const receiverId = selectedContact.id === ADMIN_SENTINEL ? null : selectedContact.id;
    const roomId = activeRoomId!;

    // Optimistic update
    const tempMsg: Message = {
      id: tempId,
      sender_id: myId,
      receiver_id: receiverId,
      room_id: roomId,
      message: trimmedMessage,
      is_read: false,
      admin_sender: isAdmin,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMsg]);
    setInput("");
    scrollToBottom();

    try {
      const supabase = createClient();
      const { data: inserted, error: insertErr } = await supabase
        .from("chat_messages")
        .insert({
          sender_id: myId,
          receiver_id: receiverId,
          room_id: roomId,
          message: trimmedMessage,
          admin_sender: isAdmin,
          is_read: false,
        })
        .select()
        .single();

      if (insertErr) {
        throw insertErr;
      }

      if (inserted) {
        // Mark the real ID as seen so realtime doesn't add a duplicate
        seenMsgIds.current.add(inserted.id);
        // Replace temp message with the confirmed one
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? (inserted as Message) : m))
        );
      }
    } catch (err: any) {
      console.error("Send message failed:", err);
      setError("Failed to send. " + (err?.message ?? "Please try again."));
      // Remove the temp message
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setInput(trimmedMessage); // Restore input so user doesn't lose their message
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!open) return null;

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex flex-col bg-white rounded-2xl shadow-2xl border border-[#E8E4DB] transition-all duration-300 overflow-hidden ${
        minimized ? "w-72 h-14" : "w-80 sm:w-96 h-[520px]"
      }`}
      style={{ maxHeight: "calc(100vh - 100px)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-dark shrink-0 rounded-t-2xl">
        <div className="flex items-center gap-2.5">
          {selectedContact && !minimized && (
            <button
              onClick={() => setSelectedContact(null)}
              className="text-white/60 hover:text-white transition-colors cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>
          )}
          <MessageSquare size={16} className="text-accent" />
          <span className="text-white text-sm font-bold">
            {selectedContact ? selectedContact.name : "Team Chat"}
          </span>
          {selectedContact && (
            <span className="text-white/40 text-xs truncate max-w-[100px]">
              {selectedContact.specialty || ""}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setMinimized((v) => !v)}
            className="w-6 h-6 flex items-center justify-center text-white/50 hover:text-white transition-colors cursor-pointer"
          >
            {minimized ? <Maximize2 size={13} /> : <Minimize2 size={13} />}
          </button>
          <button
            onClick={() => { setOpen(false); setSelectedContact(null); }}
            className="w-6 h-6 flex items-center justify-center text-white/50 hover:text-white transition-colors cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {!minimized && (
        <>
          {!selectedContact ? (
            /* Contact List */
            <div className="flex flex-col flex-1 overflow-hidden">
              <div className="px-3 py-2.5 border-b border-[#E8E4DB] shrink-0">
                <div className="relative">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9B9B9B]" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search contacts…"
                    className="w-full pl-8 pr-3 py-1.5 bg-[#F7F5F0] rounded-xl text-xs text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-accent/20"
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                {filtered.length === 0 ? (
                  <div className="py-10 text-center text-xs text-[#9B9B9B]">No contacts found</div>
                ) : (
                  filtered.map((contact) => {
                    const roomId = getRoomId(myId, contact.id);
                    const unread = unreadMap[roomId] ?? 0;
                    const color = getAvatarColor(contact.id);
                    return (
                      <button
                        key={contact.id}
                        onClick={() => {
                          setSelectedContact(contact);
                          setUnreadMap((prev) => ({ ...prev, [roomId]: 0 }));
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#F7F5F0] transition-colors text-left cursor-pointer border-b border-[#F0EDE8] last:border-0"
                      >
                        <div className={`w-9 h-9 rounded-full ${color} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                          {getInitials(contact.name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-[#1A1A1A] truncate">{contact.name}</p>
                          <p className="text-xs text-[#9B9B9B] truncate">{contact.specialty || "Staff"}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          {unread > 0 && (
                            <span className="w-4 h-4 rounded-full bg-accent text-white text-[10px] font-bold flex items-center justify-center">
                              {unread}
                            </span>
                          )}
                          <Circle size={7} className="text-green-400 fill-green-400" />
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          ) : (
            /* Chat Window */
            <div className="flex flex-col flex-1 overflow-hidden">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
                {messages.length === 0 && !error && (
                  <div className="flex flex-col items-center justify-center h-full text-center py-8">
                    <MessageSquare size={28} className="text-[#D4CFC6] mb-2" />
                    <p className="text-xs text-[#9B9B9B] font-medium">No messages yet</p>
                    <p className="text-[11px] text-[#C4BFB8] mt-0.5">Start the conversation!</p>
                  </div>
                )}
                {error && (
                  <div className="mx-2 mt-2 px-3 py-2 bg-red-50 border border-red-200 rounded-xl">
                    <p className="text-xs text-red-600">{error}</p>
                  </div>
                )}
                {messages.map((msg, i) => {
                  const isMine = isAdmin ? msg.admin_sender : msg.sender_id === myId;
                  const isTemp = msg.id.startsWith("temp-");
                  const showTime =
                    i === 0 ||
                    new Date(msg.created_at).getTime() - new Date(messages[i - 1].created_at).getTime() > 300000;
                  return (
                    <div key={msg.id}>
                      {showTime && (
                        <div className="text-center py-1">
                          <span className="text-[10px] text-[#9B9B9B] bg-[#F7F5F0] px-2 py-0.5 rounded-full">
                            {timeLabel(msg.created_at)}
                          </span>
                        </div>
                      )}
                      <div className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-[75%] px-3 py-2 rounded-2xl text-xs leading-relaxed shadow-sm ${
                            isMine
                              ? "bg-dark text-white rounded-br-sm"
                              : "bg-[#F0EDE8] text-[#1A1A1A] rounded-bl-sm"
                          } ${isTemp ? "opacity-60" : ""}`}
                        >
                          {msg.message}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="px-3 py-2.5 border-t border-[#E8E4DB] shrink-0 flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={`Message ${selectedContact.name}…`}
                  className="flex-1 px-3 py-2 bg-[#F7F5F0] rounded-xl text-xs text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-accent/20 placeholder:text-[#9B9B9B]"
                  disabled={sending}
                  autoFocus
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || sending}
                  className="w-8 h-8 rounded-xl bg-dark flex items-center justify-center text-white disabled:opacity-30 hover:bg-[#2A2A2A] transition-colors cursor-pointer shrink-0"
                >
                  {sending ? (
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Send size={14} />
                  )}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default ChatPanel;
