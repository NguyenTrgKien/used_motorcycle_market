export interface CategoryOption {
  id: number;
  name: string;
  slug: string;
  listingFormSchema?: import("./helpers/listingFormSchema").ListingFormSchema;
}

export interface VehicleInfo {
  brandName: string;
  modelName: string;
  bodyType: string;
  manufactureYear?: number;
  registrationYear?: number;
  mileage?: number;
  color?: string;
  condition: string;
  engineCapacity?: string;
  enginePower?: string;
  batteryCapacity?: string;
  rangePerCharge?: string;
  licensePlate?: string;
  fuelType: string;
  transmission: string;
  origin?: string;
  documentsStatus?: string;
  documentImages?: Array<{
    url: string;
    publicId: string;
  }>;
  seatCount?: number;
  doorCount?: number;
  payloadKg?: number;
  grossWeightKg?: number;
  wheelCount?: number;
}

export interface PostImageInfo {
  id: number;
  imageUrl: string;
  isPrimary: boolean;
  sortOrder: number;
}

export interface PostSellerInfo {
  id: number;
  fullName?: string;
  avatar?: string;
  isVerified?: boolean;
  phone?: string;
  reviewCount?: number;
  averageRating?: number;
  sellerType?: "individual" | "professional";
  store?: {
    id: number;
    storeName: string;
    logoUrl?: string;
  };
  professionalSellerProfile?: {
    id: number;
    storeName: string;
    logoUrl?: string;
  };
}

export interface BoostCampaignInfo {
  id: number;
  postId: number;
  planName?: string;
  totalBoosts: number;
  boostsCompleted: number;
  startedAt: string;
  nextBoostAt?: string | null;
  expectedEndAt?: string;
  status: "active" | "completed" | "cancelled";
}

export interface ListingPost {
  id: number;
  title: string;
  slug: string;
  description?: string;
  price: number;
  status: string;
  province: string;
  district?: string;
  ward?: string;
  addressDetail?: string;
  viewCount: number;
  createdAt: string;
  listingBillingType?: "free" | "paid";
  listingPricingGroup?: "large_vehicle" | "other_vehicle";
  listingFee?: number;
  freeQuotaRefunded?: boolean;
  promotionType?: "featured" | "vip";
  promotionStartedAt?: string;
  promotionExpiredAt?: string;
  lastBoostedAt?: string;
  rejectedReason?: string;
  hiddenReason?: string;
  hiddenAt?: string;
  hiddenBy?: number;
  vehicle?: VehicleInfo;
  category?: CategoryOption;
  user?: PostSellerInfo;
  post_images?: PostImageInfo[];
  isSaved?: boolean;
  paymentOrder?: {
    id: string;
    code?: string;
    amount?: number;
    method: "vnpay" | "momo" | "bank_transfer";
    status: "pending" | "paid" | "failed" | "cancelled" | "rejected";
    transferSubmittedAt?: string;
    receiptUrl?: string | null;
    rejectedReason?: string;
    rejectedAt?: string;
    paidAt?: string;
    createdAt?: string;
    expiresAt?: string;
    gatewayTransactionId?: string;
    rejectionHistory?: Array<{
      reason: string;
      rejectedAt: string;
      rejectedBy: number;
      receiptUrl?: string;
    }>;
  } | null;
}
