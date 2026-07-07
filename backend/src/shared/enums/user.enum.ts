export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
}

export enum UserStatus {
  ACTIVE = 'active',
  BANNED = 'banned',
}

export enum UserGender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
}

export enum VerificationType {
  LOGIN = 'login',
  REGISTER_EMAIL = 'register_email',
  CHANGE_EMAIL = 'change_email',
  RESET_PASSWORD = 'reset_password',
  ADD_PHONE = 'add_phone',
  CHANGE_PHONE = 'change_phone',

  ENABLE_2FA = 'enable_2fa',
  DISABLE_2FA = 'disable_2fa',
}

export enum IdType {
  CCCD = 'cccd',
  PASSPORT = 'passport',
}

export enum IdentityStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum UserTwoFactorMethod {
  EMAIL = 'email',
  SMS = 'sms',
  AUTHENTICATOR = 'authenticator',
}
