import type { UserGender, UserRole, UserStatus } from "../shared";
import type { UserAddressType } from "./address.type";

export interface UserType {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  avatar: string;
  gender: UserGender;
  role: UserRole;
  status: UserStatus;
  isVerified: boolean;
  isGoogleLinked: boolean;
  hasPassword: boolean;
  addresses: UserAddressType[];
  createdAt: string;
  updatedAt: string;
}

