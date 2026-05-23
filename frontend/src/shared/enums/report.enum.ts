export const TargetType = {
  POST: "post",
  USER: "user",
} as const;

export type TargetType =
  (typeof TargetType)[keyof typeof TargetType];

export const ReasonType = {
  FAKE_INFO: "fake_info",
  WRONG_PRICE: "wrong_price",
  DUPLICATE_POST: "duplicate_post",
  ALREADY_SOLD: "already_sold",
  STOLEN_VEHICLE: "stolen_vehicle",
  FAKE_IMAGES: "fake_images",

  FRAUD: "fraud",
  SPAM: "spam",
  ABUSIVE: "abusive",
  SCAM: "scam",

  OTHER: "other",
} as const;

export type ReasonType =
  (typeof ReasonType)[keyof typeof ReasonType];

export const ReportStatus = {
  PENDING: "pending",
  RESOLVED: "resolved",
  REJECTED: "rejected",
} as const;

export type ReportStatus =
  (typeof ReportStatus)[keyof typeof ReportStatus];