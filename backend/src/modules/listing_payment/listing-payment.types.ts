export enum ListingPricingGroup {
  LARGE_VEHICLE = 'large_vehicle',
  OTHER_VEHICLE = 'other_vehicle',
}

export enum ListingBillingType {
  FREE = 'free',
  PAID = 'paid',
}

export enum ListingPaymentMethod {
  VNPAY = 'vnpay',
  MOMO = 'momo',
  BANK_TRANSFER = 'bank_transfer',
}

export enum ListingPaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REJECTED = 'rejected',
}

export const LISTING_FEE = 30000;
export const LARGE_VEHICLE_CATEGORY_SLUGS = [
  'o-to',
  'xe-tai',
  'xe-chuyen-dung',
];
