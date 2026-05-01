export enum UserRole {
  ADMIN = "admin",
  USER = "user",
}

export enum UserStatus {
  ACTIVE = "active",
  BANNED = "banned",
}

export enum UserGender {
  MALE = "male",
  FEMALE = "female",
  OTHER = "other",
}

export enum VerificationType {
  EMAIL = "email",
  RESET_PASSWORD = "reset_password",
  PHONE_OTP = "phone_otp",
}

export enum IdType {
  CCCD = "cccd",
  PASSPORT = "passport",
}

export enum IdentityStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  APPROVED = "approved",
  REJECTED = "rejected",
}
