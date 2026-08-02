import type { ChatMessage, FileMessageContent } from "./messages.types";

export function formatTime(value?: string) {
  if (!value) return "";

  return new Date(value).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isSameDate(firstDate: Date, secondDate: Date) {
  return (
    firstDate.getFullYear() === secondDate.getFullYear() &&
    firstDate.getMonth() === secondDate.getMonth() &&
    firstDate.getDate() === secondDate.getDate()
  );
}

export function formatConversationTime(value?: string) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  if (isSameDate(date, now)) {
    return formatTime(value);
  }

  if (isSameDate(date, yesterday)) {
    return "Hôm qua";
  }

  const diffInDays = Math.floor(
    (new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() -
      new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()) /
      (1000 * 60 * 60 * 24),
  );

  if (diffInDays > 1 && diffInDays < 7) {
    return date.toLocaleDateString("vi-VN", { weekday: "short" });
  }

  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
    });
  }

  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function parseFileMessage(content: string): FileMessageContent {
  try {
    return JSON.parse(content) as FileMessageContent;
  } catch {
    return {
      url: content,
      name: "Tệp đính kèm",
      size: 0,
      mimeType: "",
    };
  }
}

export function formatFileSize(size?: number) {
  if (!size) return "";

  if (size < 1024 * 1024) {
    return `${Math.ceil(size / 1024)} KB`;
  }

  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

export function getMessagePreview(message: ChatMessage) {
  if (message.messageType === "image") return "[Hình ảnh]";
  if (message.messageType === "file") return "[Tệp đính kèm]";

  return message.content;
}
