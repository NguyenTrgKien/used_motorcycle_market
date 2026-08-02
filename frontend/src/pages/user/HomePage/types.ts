import type { ListingPost } from "../Post/post.types";

export interface HomeCategory {
  id: number;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  image?: string;
  status: string;
}

export interface PostsResponse {
  data: {
    items: ListingPost[];
    total: number;
  };
}

export interface CategoriesResponse {
  data: HomeCategory[];
}

export interface VehicleBrand {
  id: number;
  name: string;
  slug: string;
  logo?: string;
  country?: string;
  isActive: boolean;
  categories?: HomeCategory[];
}

export interface BrandsResponse {
  data: VehicleBrand[];
}
