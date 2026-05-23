export const UserRole = {
  ADMIN: "admin",
  USER: "user",
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const UserStatus = {
  ACTIVE: "active",
  BANNED: "banned",
} as const;

export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];

export const UserGender = {
  MALE: "male",
  FEMALE: "female",
  OTHER: "other",
} as const;

export type UserGender = (typeof UserGender)[keyof typeof UserGender];

export const VerificationType = {
  EMAIL: "email",
  RESET_PASSWORD: "reset_password",
  PHONE_OTP: "phone_otp",
} as const;

export type VerificationType =
  (typeof VerificationType)[keyof typeof VerificationType];

export const IdType = {
  CCCD: "cccd",
  PASSPORT: "passport",
} as const;

export type IdType = (typeof IdType)[keyof typeof IdType];

export const IdentityStatus = {
  PENDING: "pending",
  PROCESSING: "processing",
  APPROVED: "approved",
  REJECTED: "rejected",
} as const;

export type IdentityStatus =
  (typeof IdentityStatus)[keyof typeof IdentityStatus];
