export const PostStatus = {
  PENDING: "pending",
  ACTIVE: "active",
  SOLD: "sold",
  REJECTED: "rejected",
} as const;

export type PostStatus =
  (typeof PostStatus)[keyof typeof PostStatus];