export interface CategoryOption {
  id: number;
  name: string;
  slug: string;
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
  vehicle?: VehicleInfo;
  category?: CategoryOption;
  user?: PostSellerInfo;
  post_images?: PostImageInfo[];
}
