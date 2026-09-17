import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  try {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return String(date);
  }
}

export function formatTime(timeOrDate: string | Date): string {
  try {
    if (typeof timeOrDate === "string" && /^\d{2}:\d{2}(:\d{2})?$/.test(timeOrDate)) {
      const [h, m] = timeOrDate.split(":");
      const hours = parseInt(h, 10);
      const ampm = hours >= 12 ? "PM" : "AM";
      const formattedH = hours % 12 || 12;
      return `${formattedH}:${m} ${ampm}`;
    }
    return new Date(timeOrDate).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return String(timeOrDate);
  }
}

export function getInitials(name: string): string {
  if (!name) return "U";
  return (
    name
      .replace(/^Dr\.\s*/i, "")
      .trim()
      .split(/\s+/)
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "U"
  );
}

export function calcCompletionPct(completed: number, planned: number): number {
  if (!planned || planned <= 0) return 0;
  return Math.min(100, Math.round((completed / planned) * 100));
}

export function calcHours(checkIn: string, checkOut: string): number {
  if (!checkIn || !checkOut) return 0;
  const cleanIn = checkIn.slice(0, 5);
  const cleanOut = checkOut.slice(0, 5);
  const [inH, inM] = cleanIn.split(":").map(Number);
  const [outH, outM] = cleanOut.split(":").map(Number);
  if (isNaN(inH) || isNaN(inM) || isNaN(outH) || isNaN(outM)) return 0;
  const inMinutes = inH * 60 + inM;
  const outMinutes = outH * 60 + outM;
  if (outMinutes <= inMinutes) return 0;
  return parseFloat(((outMinutes - inMinutes) / 60).toFixed(2));
}

