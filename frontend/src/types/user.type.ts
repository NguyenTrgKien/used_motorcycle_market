import type { UserGender, UserRole, UserStatus } from "@project/shared";
import type { UserAddressType } from "./address.type";

export interface UserType {
  id: number;
  fullName: string;
  phone: string;
  email: string;
  avatar: string;
  gender: UserGender;
  role: UserRole;
  status: UserStatus;
  isVerified: boolean;
  addresses: UserAddressType[];
  createdAt: string;
  updatedAt: string;
}
