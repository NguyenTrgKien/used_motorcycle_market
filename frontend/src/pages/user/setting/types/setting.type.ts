export type TwoFactorMethod = "email" | "sms" | "authenticator";

export interface SecurityReponse {
  isVerified: boolean;
  two_factor_enabled: boolean;
  two_factor_method: TwoFactorMethod;
}
