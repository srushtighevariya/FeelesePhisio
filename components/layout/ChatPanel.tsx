"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  MessageSquare, X, Send, ChevronLeft, Search,
  Circle, Minimize2, Maximize2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { sendChatMessage, markChatMessagesRead } from "@/lib/actions/chat";

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

// Sentinel ID for admin participant
const ADMIN_SENTINEL = "admin";

export function ChatPanel({
  currentTherapistId,
  currentUserId,
  isAdmin,
  therapists,
  currentUserName,
}: Props) {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Therapist | { id: "admin"; name: string; specialty: string } | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState("");
  const [unreadMap, setUnreadMap] = useState<Record<string, number>>({});
  const [totalUnread, setTotalUnread] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const myId = isAdmin ? ADMIN_SENTINEL : (currentTherapistId ?? "");

  // Build contact list
  const contacts: Array<{ id: string; name: string; specialty?: string | null }> = isAdmin
    ? therapists.map((t) => ({ id: t.id, name: t.name, specialty: t.specialty }))
    : [
        { id: ADMIN_SENTINEL, name: "Clinic Admin", specialty: "Administration" },
        ...therapists.filter((t) => t.id !== currentTherapistId),
      ];

  const filtered = contacts.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const activeRoomId = selectedContact
    ? getRoomId(myId, selectedContact.id)
    : null;

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  }, []);

  // Load messages for selected room
  useEffect(() => {
    if (!activeRoomId) {
      setMessages([]);
      return;
    }
    const supabase = createClient();
    supabase
      .from("chat_messages")
      .select("*")
      .eq("room_id", activeRoomId)
      .order("created_at", { ascending: true })
      .limit(80)
      .then(({ data }) => {
        setMessages((data ?? []) as Message[]);
        scrollToBottom();
      });

    // Mark read
    if (myId) {
      markChatMessagesRead(activeRoomId, myId).catch(() => {});
      setUnreadMap((prev) => ({ ...prev, [activeRoomId]: 0 }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRoomId]);

  // Realtime subscription for all messages involving current user
  useEffect(() => {
    if (!myId) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`chat-${myId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages" },
        (payload) => {
          const msg = payload.new as Message;
          const isForMe = msg.room_id.includes(myId);
          if (!isForMe) return;

          if (msg.room_id === activeRoomId) {
            setMessages((prev) => [...prev, msg]);
            scrollToBottom();
            // mark read immediately
            if (myId) markChatMessagesRead(msg.room_id, myId).catch(() => {});
          } else {
            // bump unread badge
            setUnreadMap((prev) => ({
              ...prev,
              [msg.room_id]: (prev[msg.room_id] ?? 0) + 1,
            }));
            setTotalUnread((n) => n + 1);
          }
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myId, activeRoomId]);

  // Compute total unread on open
  useEffect(() => {
    const total = Object.values(unreadMap).reduce((a, b) => a + b, 0);
    setTotalUnread(total);
  }, [unreadMap]);

  const handleSend = async () => {
    if (!input.trim() || !selectedContact || !myId || sending) return;
    setSending(true);
    const tempId = `temp-${Date.now()}`;
    const tempMsg: Message = {
      id: tempId,
      sender_id: myId,
      receiver_id: selectedContact.id === ADMIN_SENTINEL ? null : selectedContact.id,
      room_id: activeRoomId!,
      message: input.trim(),
      is_read: false,
      admin_sender: isAdmin,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMsg]);
    setInput("");
    scrollToBottom();
    try {
      await sendChatMessage({
        sender_id: myId,          // "admin" or therapist UUID
        receiver_id: selectedContact.id === ADMIN_SENTINEL ? null : selectedContact.id,
        room_id: activeRoomId!,
        message: tempMsg.message,
        admin_sender: isAdmin,
      });
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
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

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-dark shadow-2xl flex items-center justify-center hover:scale-105 transition-transform cursor-pointer group"
        aria-label="Open Chat"
      >
        <MessageSquare size={22} className="text-white" />
        {totalUnread > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-accent text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
            {totalUnread > 9 ? "9+" : totalUnread}
          </span>
        )}
      </button>
    );
  }

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
              {/* Search */}
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
              {/* Contact list */}
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
                          setSelectedContact(contact as any);
                          setUnreadMap((prev) => ({ ...prev, [roomId]: 0 }));
                          setTotalUnread((n) => Math.max(0, n - (unreadMap[roomId] ?? 0)));
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
                {messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-center py-8">
                    <MessageSquare size={28} className="text-[#D4CFC6] mb-2" />
                    <p className="text-xs text-[#9B9B9B] font-medium">No messages yet</p>
                    <p className="text-[11px] text-[#C4BFB8] mt-0.5">Start the conversation!</p>
                  </div>
                )}
                {messages.map((msg, i) => {
                  const isMine = isAdmin ? msg.admin_sender : msg.sender_id === myId;
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
                          } ${msg.id.startsWith("temp-") ? "opacity-60" : ""}`}
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
                  <Send size={14} />
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
