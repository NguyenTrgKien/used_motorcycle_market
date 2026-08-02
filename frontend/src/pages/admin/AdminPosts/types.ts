import type { ListingPost } from "../../user/Post/post.types";

export interface AdminManagedPost extends ListingPost {
  approvedAt?: string;
  soldAt?: string;
  reportCount?: number;
  user?: ListingPost["user"] & {
    email?: string;
  };
}

export interface AdminPostsResponse {
  data: {
    items: AdminManagedPost[];
    total: number;
    page: number;
    limit: number;
  };
}

export interface AdminPostFilters {
  displayStatus: string;
  bodyType: string;
  brandName: string;
  modelName: string;
  minPrice: string;
  maxPrice: string;
  dateField: string;
  dateFrom: string;
  dateTo: string;
  province: string;
  district: string;
  hasReports: string;
  sort: string;
}
