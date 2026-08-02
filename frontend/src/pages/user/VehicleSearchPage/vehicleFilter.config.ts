export type VehicleFilterSection =
  | "price"
  | "condition"
  | "brandName"
  | "bodyType"
  | "fuelType"
  | "transmission"
  | "year";

export const categoryFilterFields: Record<string, VehicleFilterSection[]> = {
  "xe-may": ["brandName", "bodyType"],
  "o-to": ["brandName", "bodyType", "transmission", "fuelType"],
  "xe-tai": ["brandName", "bodyType", "fuelType", "year"],
  "xe-dien": ["brandName", "bodyType", "year"],
  "xe-chuyen-dung": ["bodyType", "fuelType", "year"],
};

export const categoryBodyTypes: Record<string, string[]> = {
  "xe-may": ["motorbike", "motorcycle", "scooter", "other"],
  "o-to": ["car", "van", "bus", "other"],
  "xe-tai": ["truck", "dump_truck", "van", "other"],
  "xe-dien": ["motorbike", "motorcycle", "scooter", "car", "other"],
  "xe-chuyen-dung": [
    "special_purpose",
    "dump_truck",
    "truck",
    "other",
  ],
};
