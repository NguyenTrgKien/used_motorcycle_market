export const NotificationType = {
  POST_APPROVED: "post_approve",
  POST_REJECTED: "post_rejected",
  NEW_MESSAGE: "new_message",
  NEW_REVIEW: "new_review",
  NEW_POST_PENDING: "new_posst_pending",
  BANK_TRANSFER_SUBMITTED: "bank_transfer_submitted",
  BANK_TRANSFER_REJECTED: "bank_transfer_rejected",
  BANK_TRANSFER_CONFIRMED: "bank_transfer_confirmed",
} as const;

export type NotificationType =
  (typeof NotificationType)[keyof typeof NotificationType];
