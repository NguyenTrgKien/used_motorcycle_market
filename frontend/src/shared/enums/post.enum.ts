export const PostStatus = {
  PENDING: "pending",
  ACTIVE: "active",
  SOLD: "sold",
  HIDDEN: "hidden",
  REJECTED: "rejected",
} as const;

export type PostStatus =
  (typeof PostStatus)[keyof typeof PostStatus];
