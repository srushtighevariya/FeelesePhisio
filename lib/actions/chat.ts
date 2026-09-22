"use server";

import { createClient } from "@/lib/supabase/server";

export async function sendChatMessage(data: {
  sender_id: string;       // therapist UUID or "admin"
  receiver_id: string | null;
  room_id: string;
  message: string;
  admin_sender?: boolean;
}) {
  const supabase = await createClient();
  const { error } = await supabase.from("chat_messages").insert({
    sender_id: data.sender_id,
    receiver_id: data.receiver_id,
    room_id: data.room_id,
    message: data.message.trim(),
    admin_sender: data.admin_sender ?? false,
    is_read: false,
  });
  if (error) throw new Error(error.message);
  return { success: true };
}

export async function markChatMessagesRead(roomId: string, myId: string) {
  const supabase = await createClient();
  await supabase
    .from("chat_messages")
    .update({ is_read: true })
    .eq("room_id", roomId)
    .neq("sender_id", myId)
    .eq("is_read", false);
  return { success: true };
}

export async function getChatHistory(roomId: string, limit = 60) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("room_id", roomId)
    .order("created_at", { ascending: true })
    .limit(limit);
  if (error) throw new Error(error.message);
  return data ?? [];
}
