import type { initialForm } from "../constants/createPost.constants";

export type CreatePostForm = typeof initialForm;

export type AddressOption = {
  name: string;
  districts?: AddressOption[];
  wards?: AddressOption[];
};

export type SelectOption = {
  value: string;
  label: string;
};

export type YearFieldName = "manufactureYear" | "registrationYear";

export type AiSuggestion = {
  confidence?: number;
  notes?: string[];
};

export type PriceSuggestion = {
  suggestedPrice: number;
  minPrice: number;
  maxPrice: number;
  confidence: number;
  reason: string;
  missingFields?: string[];
  comparablesUsed?: number;
};
