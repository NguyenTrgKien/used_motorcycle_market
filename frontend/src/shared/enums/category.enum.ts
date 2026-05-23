export const CategoryStatus = {
  ACTIVE: "active",
  INACTIVE: "inactive",
} as const;

export type CategoryStatus =
  (typeof CategoryStatus)[keyof typeof CategoryStatus];
