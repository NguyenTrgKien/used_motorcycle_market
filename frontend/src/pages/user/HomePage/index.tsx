import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../../configs/axiosInstance";
import { CategoryStatus } from "../../../shared";
import type { ListingPost } from "../Post/post.types";
import BenefitsSection from "./components/BenefitsSection";
import BrandSection from "./components/BrandSection";
import CategorySection from "./components/CategorySection";
import PopularPostsSection from "./components/PopularPostsSection";
import RecommendationSection from "./components/RecommendationSection";
import SectionError from "./components/SectionError";
import {
  BrandSectionSkeleton,
  PostSectionSkeleton,
} from "./components/Skeletons";
import type {
  BrandsResponse,
  CategoriesResponse,
  HomeCategory,
  PostsResponse,
  VehicleBrand,
} from "./types";

function HomePage() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<HomeCategory[]>([]);
  const [vehicleBrands, setVehicleBrands] = useState<VehicleBrand[]>([]);
  const [posts, setPosts] = useState<ListingPost[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [isLoadingBrands, setIsLoadingBrands] = useState(true);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [hasCategoriesError, setHasCategoriesError] = useState(false);
  const [hasBrandsError, setHasBrandsError] = useState(false);
  const [hasPostsError, setHasPostsError] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState("");

  const activeCategories = useMemo(
    () =>
      categories.filter(
        (category) => category.status === CategoryStatus.ACTIVE,
      ),
    [categories],
  );

  const brands = useMemo(
    () =>
      vehicleBrands
        .filter((brand) => brand.isActive)
        .sort((a, b) => a.name.localeCompare(b.name, "vi")),
    [vehicleBrands],
  );

  const filteredPosts = useMemo(
    () =>
      posts.filter((post) => {
        const matchesBrand =
          !selectedBrand ||
          post.vehicle?.brandName?.toLowerCase() ===
            selectedBrand.toLowerCase();
        return matchesBrand;
      }),
    [posts, selectedBrand],
  );

  const popularPosts = useMemo(
    () => [...posts].sort((a, b) => b.viewCount - a.viewCount),
    [posts],
  );

  const fetchCategories = useCallback(async () => {
    try {
      setIsLoadingCategories(true);
      setHasCategoriesError(false);
      const res =
        await axiosInstance.get<CategoriesResponse>("/api/v1/categories");
      setCategories(res.data.data || []);
    } catch {
      setHasCategoriesError(true);
    } finally {
      setIsLoadingCategories(false);
    }
  }, []);

  const fetchBrands = useCallback(async () => {
    try {
      setIsLoadingBrands(true);
      setHasBrandsError(false);
      const res = await axiosInstance.get<BrandsResponse>(
        "/api/v1/vehicle/brands",
      );
      setVehicleBrands(res.data.data || []);
    } catch {
      setHasBrandsError(true);
    } finally {
      setIsLoadingBrands(false);
    }
  }, []);

  const fetchPosts = useCallback(async () => {
    try {
      setIsLoadingPosts(true);
      setHasPostsError(false);
      const res = await axiosInstance.get<PostsResponse>("/api/v1/posts", {
        params: {
          limit: 24,
        },
      });
      setPosts(res.data.data.items || []);
    } catch {
      setHasPostsError(true);
    } finally {
      setIsLoadingPosts(false);
    }
  }, []);

  useEffect(() => {
    void fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    void fetchBrands();
  }, [fetchBrands]);

  useEffect(() => {
    void fetchPosts();
  }, [fetchPosts]);

  const handleSelectBrand = (brand: string) => {
    navigate(`/vehicles?brandName=${encodeURIComponent(brand)}`);
  };

  const handleResetFilters = () => {
    setSelectedBrand("");
  };

  const hasFilters = Boolean(selectedBrand);

  return (
    <div className="bg-gray-100 pb-16">
      <div className="mx-auto max-w-[120rem] px-4 pt-[6rem] sm:px-6 lg:px-8">
        <CategorySection
          categories={activeCategories}
          isLoading={isLoadingCategories}
          hasError={hasCategoriesError}
          onRetry={() => void fetchCategories()}
        />
        <RecommendationSection
          posts={filteredPosts}
          isLoading={isLoadingPosts}
          hasError={hasPostsError}
          hasFilters={hasFilters}
          onReset={handleResetFilters}
          onRetry={() => void fetchPosts()}
        />
        {isLoadingBrands ? (
          <BrandSectionSkeleton />
        ) : hasBrandsError ? (
          <SectionError
            title="Không thể tải hãng xe"
            description="Đã có sự cố khi tải danh sách hãng xe."
            onRetry={() => void fetchBrands()}
            className="mt-8"
          />
        ) : (
          <BrandSection
            brands={brands}
            selectedBrand={selectedBrand}
            onSelect={handleSelectBrand}
          />
        )}

        {hasPostsError ? null : isLoadingPosts ? (
          <PostSectionSkeleton count={4} />
        ) : (
          <PopularPostsSection posts={popularPosts} />
        )}
        <BenefitsSection />
      </div>
    </div>
  );
}

export default HomePage;
