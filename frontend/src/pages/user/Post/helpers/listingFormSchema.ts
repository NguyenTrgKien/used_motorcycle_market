import type { CreatePostForm } from "../types/createPost.types";

export type ListingVehicleField = Exclude<
  keyof CreatePostForm,
  | "categoryId"
  | "title"
  | "description"
  | "price"
  | "province"
  | "district"
  | "ward"
  | "addressDetail"
>;

export interface ListingFormSchema {
  version: number;
  visibleFields: ListingVehicleField[];
  requiredFields: ListingVehicleField[];
  requiredWhenUsedFields: ListingVehicleField[];
  aiFields: ListingVehicleField[];
}

export const listingVehicleFields: ListingVehicleField[] = [
  "brandName", "modelName", "bodyType", "manufactureYear",
  "registrationYear", "mileage", "color", "condition",
  "engineCapacity", "enginePower", "batteryCapacity", "rangePerCharge",
  "licensePlate", "fuelType", "transmission", "origin",
  "documentsStatus", "seatCount", "doorCount", "payloadKg",
  "grossWeightKg", "wheelCount",
];

export const fallbackListingFormSchema: ListingFormSchema = {
  version: 1,
  visibleFields: [
    "brandName", "modelName", "bodyType", "manufactureYear",
    "registrationYear", "color", "condition", "origin",
  ],
  requiredFields: ["condition"],
  requiredWhenUsedFields: [],
  aiFields: [
    "brandName", "modelName", "bodyType", "manufactureYear",
    "registrationYear", "color", "condition", "origin",
  ],
};

export function isUsedCondition(condition: string) {
  return ["used", "excellent", "good", "fair"].includes(condition);
}
