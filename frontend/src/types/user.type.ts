import type {
  SellerType,
  UserGender,
  UserRole,
  UserStatus,
} from "../shared";
import type { UserAddressType } from "./address.type";

export interface UserType {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  privacy?: {
    showEmail: boolean;
    showPhone: boolean;
  };
  avatar: string;
  personalInfo?: string;
  gender: UserGender;
  role: UserRole;
  sellerType: SellerType;
  status: UserStatus;
  isVerified: boolean;
  isPhoneVerified: boolean;
  isGoogleLinked: boolean;
  hasPassword: boolean;
  hasSeenCreatePostGuide: boolean;
  addresses: UserAddressType[];
  createdAt: string;
  updatedAt: string;
}

