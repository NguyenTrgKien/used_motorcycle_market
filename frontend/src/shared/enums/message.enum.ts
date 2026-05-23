export const MessageType = {
  TEXT: "text",
  IMAGE: "image",
} as const;

export type MessageType =
  (typeof MessageType)[keyof typeof MessageType];