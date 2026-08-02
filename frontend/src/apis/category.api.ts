import axiosInstance from "../configs/axiosInstance";
import type {
  CategoriesResponse,
  HomeCategory,
} from "../pages/user/HomePage/types";

export const getCategories = async (): Promise<HomeCategory[]> => {
  const response =
    await axiosInstance.get<CategoriesResponse>("/api/v1/categories");
  return response.data.data || [];
};
