import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  faCarSide,
  faChevronDown,
  faChevronRight,
  faFilter,
  faGrip,
  faLayerGroup,
  faList,
  faMoneyBillWave,
  faTags,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
} from "react";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import axiosInstance from "../../../configs/axiosInstance";
import { useLocationSelection } from "../../../contexts/LocationContext";
import PostCard from "../HomePage/components/PostCard";
import { PostSkeleton } from "../HomePage/components/Skeletons";
import type {
  CategoriesResponse,
  HomeCategory,
  PostsResponse,
  BrandsResponse,
  VehicleBrand,
} from "../HomePage/types";
import {
  bodyTypeOptions,
  conditionOptions,
  fuelTypeOptions,
  transmissionOptions,
} from "../Post/constants/createPost.constants";
import type { ListingPost } from "../Post/post.types";
import VehicleFilterModal, { type VehicleFilters } from "./VehicleFilterModal";
import {
  categoryBodyTypes,
  categoryFilterFields,
  type VehicleFilterSection,
} from "./vehicleFilter.config";

const emptyFilters: VehicleFilters = {
  province: "",
  brandName: "",
  bodyType: "",
  condition: "",
  fuelType: "",
  transmission: "",
  minPrice: "",
  maxPrice: "",
  minYear: "",
  maxYear: "",
};

const persistedFilterKeys: Array<keyof VehicleFilters> = [
  "province",
  "brandName",
  "bodyType",
  "condition",
  "fuelType",
  "transmission",
  "minPrice",
  "maxPrice",
  "minYear",
  "maxYear",
];

const getFiltersFromSearchParams = (
  searchParams: URLSearchParams,
): VehicleFilters =>
  persistedFilterKeys.reduce(
    (filters, key) => ({
      ...filters,
      [key]: searchParams.get(key) || "",
    }),
    { ...emptyFilters },
  );

type QuickFilterKey =
  | "price"
  | "brand"
  | "bodyType"
  | "condition"
  | "fuelType"
  | "transmission"
  | "year";

type PostSort = "newest" | "price_asc" | "price_desc";
type PostView = "grid" | "list";

const postSortOptions: Array<{ value: PostSort; label: string }> = [
  { value: "newest", label: "Tin mới nhất" },
  { value: "price_asc", label: "Giá thấp đến cao" },
  { value: "price_desc", label: "Giá cao đến thấp" },
];

const quickFilterMeta: Record<
  QuickFilterKey,
  { label: string; icon: IconDefinition; fields: Array<keyof VehicleFilters> }
> = {
  price: {
    label: "Giá",
    icon: faMoneyBillWave,
    fields: ["minPrice", "maxPrice"],
  },
  brand: { label: "Hãng xe", icon: faTags, fields: ["brandName"] },
  bodyType: { label: "Loại xe", icon: faCarSide, fields: ["bodyType"] },
  condition: { label: "Tình trạng", icon: faLayerGroup, fields: ["condition"] },
  fuelType: { label: "Nhiên liệu", icon: faLayerGroup, fields: ["fuelType"] },
  transmission: {
    label: "Hộp số",
    icon: faLayerGroup,
    fields: ["transmission"],
  },
  year: {
    label: "Năm sản xuất",
    icon: faLayerGroup,
    fields: ["minYear", "maxYear"],
  },
};

const quickFiltersByCategory: Record<string, QuickFilterKey[]> = {
  "xe-may": ["price", "brand", "bodyType", "condition"],
  "o-to": ["price", "brand", "bodyType", "transmission", "fuelType"],
  "xe-tai": ["price", "brand", "bodyType", "fuelType", "year"],
  "xe-dien": ["price", "brand", "bodyType", "year", "condition"],
  "xe-chuyen-dung": ["price", "bodyType", "fuelType", "year", "condition"],
};

const defaultQuickFilters: QuickFilterKey[] = ["price", "condition"];

const quickFilterSections: Record<QuickFilterKey, VehicleFilterSection> = {
  price: "price",
  brand: "brandName",
  bodyType: "bodyType",
  condition: "condition",
  fuelType: "fuelType",
  transmission: "transmission",
  year: "year",
};

function VehicleSearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { location: selectedLocation } = useLocationSelection();
  const categorySlug = searchParams.get("category");
  const keyword = searchParams.get("keyword")?.trim() || "";
  const sortParam = searchParams.get("sort");
  const postSort: PostSort = postSortOptions.some(
    (option) => option.value === sortParam,
  )
    ? (sortParam as PostSort)
    : "newest";
  const postView: PostView =
    searchParams.get("view") === "list" ? "list" : "grid";
  const sellerType = searchParams.get("sellerType") || "";
  const [category, setCategory] = useState<HomeCategory | null>(null);
  const [categories, setCategories] = useState<HomeCategory[]>([]);
  const [posts, setPosts] = useState<ListingPost[]>([]);
  const [isLoadingCategory, setIsLoadingCategory] = useState(true);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [activeFilterSection, setActiveFilterSection] =
    useState<VehicleFilterSection | null>(null);
  const [filterPopoverPosition, setFilterPopoverPosition] = useState<
    { top: number; left: number } | undefined
  >();
  const filterAnchorRef = useRef<HTMLButtonElement | null>(null);
  const [filters, setFilters] = useState<VehicleFilters>(() =>
    getFiltersFromSearchParams(searchParams),
  );
  const [appliedFilters, setAppliedFilters] = useState<VehicleFilters>(() =>
    getFiltersFromSearchParams(searchParams),
  );
  const [vehicleBrands, setVehicleBrands] = useState<VehicleBrand[]>([]);
  const [isLoadingBrands, setIsLoadingBrands] = useState(true);
  const closeFilter = useCallback(() => {
    setIsFilterOpen(false);
    filterAnchorRef.current = null;
  }, []);
  const activeFilterCount = useMemo(
    () => Object.values(appliedFilters).filter(Boolean).length,
    [appliedFilters],
  );
  const quickFilters = useMemo(
    () =>
      category?.slug
        ? quickFiltersByCategory[category.slug] || defaultQuickFilters
        : defaultQuickFilters,
    [category?.slug],
  );
  const categoryBrands = useMemo(
    () =>
      vehicleBrands
        .filter(
          (brand) =>
            brand.isActive &&
            (!category ||
              brand.categories?.some((item) => item.id === category.id)),
        )
        .sort((a, b) => a.name.localeCompare(b.name, "vi")),
    [category, vehicleBrands],
  );
  const breadcrumbFilters = useMemo(() => {
    const visibleFields = category?.slug
      ? categoryFilterFields[category.slug] || []
      : ["brandName"];
    const visibleBodyTypes = category?.slug
      ? categoryBodyTypes[category.slug] || []
      : [];
    const items: Array<{ key: keyof VehicleFilters; label: string }> = [];
    const brand = categoryBrands.find(
      (item) => item.name === appliedFilters.brandName,
    );
    const bodyType = bodyTypeOptions.find(
      (item) =>
        item.value === appliedFilters.bodyType &&
        visibleFields.includes("bodyType") &&
        visibleBodyTypes.includes(item.value),
    );
    const condition = conditionOptions.find(
      (item) => item.value === appliedFilters.condition,
    );
    const fuelType = fuelTypeOptions.find(
      (item) =>
        item.value === appliedFilters.fuelType &&
        visibleFields.includes("fuelType"),
    );
    const transmission = transmissionOptions.find(
      (item) =>
        item.value === appliedFilters.transmission &&
        visibleFields.includes("transmission"),
    );

    if (
      selectedLocation?.province &&
      appliedFilters.province === selectedLocation.province
    ) {
      items.push({
        key: "province",
        label: [selectedLocation.district, selectedLocation.province]
          .filter(Boolean)
          .join(", "),
      });
    }
    if (brand && visibleFields.includes("brandName")) {
      items.push({ key: "brandName", label: brand.name });
    }
    if (bodyType) {
      items.push({ key: "bodyType", label: bodyType.label });
    }
    if (condition) {
      items.push({ key: "condition", label: condition.label });
    }
    if (fuelType) {
      items.push({ key: "fuelType", label: fuelType.label });
    }
    if (transmission) {
      items.push({ key: "transmission", label: transmission.label });
    }

    return items;
  }, [appliedFilters, category, categoryBrands, selectedLocation]);

  const openFilter = () => {
    filterAnchorRef.current = null;
    setFilters({ ...appliedFilters });
    setActiveFilterSection(null);
    setFilterPopoverPosition(undefined);
    setIsFilterOpen(true);
  };

  const openQuickFilter = (
    filterKey: QuickFilterKey,
    event: MouseEvent<HTMLButtonElement>,
  ) => {
    filterAnchorRef.current = event.currentTarget;
    const rect = filterAnchorRef.current.getBoundingClientRect();
    const popoverWidth = Math.min(380, window.innerWidth - 20);
    setFilters({ ...appliedFilters });
    setActiveFilterSection(quickFilterSections[filterKey]);
    setFilterPopoverPosition({
      top: rect.bottom + 8,
      left: Math.max(
        10,
        Math.min(rect.left, window.innerWidth - popoverWidth - 10),
      ),
    });
    setIsFilterOpen(true);
  };

  useEffect(() => {
    if (!isFilterOpen || !activeFilterSection) {
      return;
    }

    const updatePopoverPosition = () => {
      const anchor = filterAnchorRef.current;
      if (!anchor) {
        return;
      }
      const rect = anchor.getBoundingClientRect();
      const popoverWidth = Math.min(380, window.innerWidth - 20);
      setFilterPopoverPosition({
        top: rect.bottom + 8,
        left: Math.max(
          10,
          Math.min(rect.left, window.innerWidth - popoverWidth - 10),
        ),
      });
    };

    window.addEventListener("scroll", updatePopoverPosition, true);
    window.addEventListener("resize", updatePopoverPosition);
    return () => {
      window.removeEventListener("scroll", updatePopoverPosition, true);
      window.removeEventListener("resize", updatePopoverPosition);
    };
  }, [activeFilterSection, isFilterOpen]);

  const selectBrand = (brandName: string) => {
    const nextBrand = appliedFilters.brandName === brandName ? "" : brandName;
    setFilters((current) => ({ ...current, brandName: nextBrand }));
    setAppliedFilters((current) => ({ ...current, brandName: nextBrand }));
  };

  const clearCategory = () => {
    const nextSearchParams = new URLSearchParams(searchParams);
    nextSearchParams.delete("category");
    setSearchParams(nextSearchParams);
  };

  const selectCategory = (slug: string) => {
    const nextSearchParams = new URLSearchParams(searchParams);
    nextSearchParams.set("category", slug);
    nextSearchParams.delete("keyword");
    setSearchParams(nextSearchParams);
  };

  const selectPostSort = (sort: PostSort) => {
    const nextSearchParams = new URLSearchParams(searchParams);
    if (sort === "newest") {
      nextSearchParams.delete("sort");
    } else {
      nextSearchParams.set("sort", sort);
    }
    setSearchParams(nextSearchParams, { replace: true });
  };

  const selectPostView = (view: PostView) => {
    const nextSearchParams = new URLSearchParams(searchParams);
    if (view === "grid") {
      nextSearchParams.delete("view");
    } else {
      nextSearchParams.set("view", view);
    }
    setSearchParams(nextSearchParams, { replace: true });
  };

  const selectSellerType = (value: string) => {
    const nextSearchParams = new URLSearchParams(searchParams);
    if (value) {
      nextSearchParams.set("sellerType", value);
    } else {
      nextSearchParams.delete("sellerType");
    }
    setSearchParams(nextSearchParams, { replace: true });
  };

  useEffect(() => {
    const visibleFields = categorySlug
      ? categoryFilterFields[categorySlug] || []
      : ["brandName"];
    const visibleBodyTypes = categorySlug
      ? categoryBodyTypes[categorySlug] || []
      : [];
    const clearHiddenFilters = (current: VehicleFilters): VehicleFilters => ({
      ...current,
      brandName: visibleFields.includes("brandName") ? current.brandName : "",
      bodyType:
        visibleFields.includes("bodyType") &&
        (!current.bodyType || visibleBodyTypes.includes(current.bodyType))
          ? current.bodyType
          : "",
      fuelType: visibleFields.includes("fuelType") ? current.fuelType : "",
      transmission: visibleFields.includes("transmission")
        ? current.transmission
        : "",
      minYear: visibleFields.includes("year") ? current.minYear : "",
      maxYear: visibleFields.includes("year") ? current.maxYear : "",
    });
    setFilters(clearHiddenFilters);
    setAppliedFilters(clearHiddenFilters);
  }, [categorySlug]);

  useEffect(() => {
    if (!selectedLocation?.province) return;
    setFilters((current) =>
      current.province === selectedLocation.province
        ? current
        : { ...current, province: selectedLocation.province },
    );
    setAppliedFilters((current) =>
      current.province === selectedLocation.province
        ? current
        : { ...current, province: selectedLocation.province },
    );
  }, [selectedLocation]);

  useEffect(() => {
    const nextSearchParams = new URLSearchParams(window.location.search);

    if (categorySlug) {
      nextSearchParams.set("category", categorySlug);
    }

    persistedFilterKeys.forEach((key) => {
      const value = appliedFilters[key];
      if (value) {
        nextSearchParams.set(key, value);
      } else {
        nextSearchParams.delete(key);
      }
    });

    if (nextSearchParams.toString() !== searchParams.toString()) {
      setSearchParams(nextSearchParams, { replace: true });
    }
  }, [appliedFilters, categorySlug, searchParams, setSearchParams]);

  useEffect(() => {
    const fetchBrands = async () => {
      try {
        setIsLoadingBrands(true);
        const response = await axiosInstance.get<BrandsResponse>(
          "/api/v1/vehicle/brands",
        );
        setVehicleBrands(response.data.data || []);
      } catch (error: any) {
        toast.error(
          error?.response?.data?.message || "Không thể tải danh sách hãng xe",
        );
      } finally {
        setIsLoadingBrands(false);
      }
    };

    void fetchBrands();
  }, []);

  useEffect(() => {
    const fetchCategory = async () => {
      try {
        setIsLoadingCategory(true);
        setNotFound(false);
        const categoryRes =
          await axiosInstance.get<CategoriesResponse>("/api/v1/categories");
        const availableCategories = categoryRes.data.data || [];
        setCategories(availableCategories);
        const matchedCategory = categorySlug
          ? availableCategories.find((item) => item.slug === categorySlug)
          : null;

        if (categorySlug && !matchedCategory) {
          setNotFound(true);
          setCategory(null);
          setPosts([]);
          return;
        }

        setCategory(matchedCategory || null);
      } catch (error: any) {
        toast.error(
          error?.response?.data?.message || "KhÃ´ng thá»ƒ táº£i danh má»¥c xe",
        );
      } finally {
        setIsLoadingCategory(false);
      }
    };

    void fetchCategory();
  }, [categorySlug]);

  useEffect(() => {
    if (isLoadingCategory || notFound) {
      return;
    }

    const fetchPosts = async () => {
      try {
        setIsLoadingPosts(true);
        const postsRes = await axiosInstance.get<PostsResponse>(
          "/api/v1/posts",
          {
            params: {
              ...(category && { categoryId: category.id }),
              ...(appliedFilters.province && {
                province: appliedFilters.province,
              }),
              ...(appliedFilters.bodyType && {
                bodyType: appliedFilters.bodyType,
              }),
              ...(appliedFilters.fuelType && {
                fuelType: appliedFilters.fuelType,
              }),
              ...(appliedFilters.minPrice && {
                minPrice: appliedFilters.minPrice,
              }),
              ...(appliedFilters.maxPrice && {
                maxPrice: appliedFilters.maxPrice,
              }),
              ...(keyword && { keyword }),
              ...(sellerType && { sellerType }),
              sort: postSort,
              limit: 24,
            },
          },
        );
        const items = postsRes.data.data.items || [];
        setPosts(
          items.filter((post) => {
            const vehicle = post.vehicle;
            const year = vehicle?.manufactureYear;
            return (
              (!appliedFilters.brandName ||
                vehicle?.brandName
                  ?.toLowerCase()
                  .includes(appliedFilters.brandName.toLowerCase())) &&
              (!appliedFilters.condition ||
                vehicle?.condition === appliedFilters.condition) &&
              (!appliedFilters.transmission ||
                vehicle?.transmission === appliedFilters.transmission) &&
              (!appliedFilters.minYear ||
                (year !== undefined &&
                  year >= Number(appliedFilters.minYear))) &&
              (!appliedFilters.maxYear ||
                (year !== undefined && year <= Number(appliedFilters.maxYear)))
            );
          }),
        );
      } catch (error: any) {
        toast.error(
          error?.response?.data?.message ||
            "Không thể tải tin đăng theo danh mục",
        );
      } finally {
        setIsLoadingPosts(false);
      }
    };

    void fetchPosts();
  }, [
    category,
    appliedFilters,
    isLoadingCategory,
    keyword,
    notFound,
    postSort,
    sellerType,
  ]);

  const handleApplyFilters = () => {
    if (
      filters.minPrice &&
      filters.maxPrice &&
      Number(filters.minPrice) > Number(filters.maxPrice)
    ) {
      toast.error("Giá thấp nhất không thể lớn hơn giá cao nhất");
      return;
    }
    if (
      filters.minYear &&
      filters.maxYear &&
      Number(filters.minYear) > Number(filters.maxYear)
    ) {
      toast.error("Năm bắt đầu không thể lớn hơn năm kết thúc");
      return;
    }
    setAppliedFilters({ ...filters });
    closeFilter();
  };

  const handleFilterChange = (name: keyof VehicleFilters, value: string) => {
    setFilters((current) => ({ ...current, [name]: value }));
    if (filterPopoverPosition) {
      setAppliedFilters((current) => ({ ...current, [name]: value }));
    }
  };

  const handleResetFilters = () => {
    if (activeFilterSection) {
      const fieldsBySection: Record<
        VehicleFilterSection,
        Array<keyof VehicleFilters>
      > = {
        price: ["minPrice", "maxPrice"],
        condition: ["condition"],
        brandName: ["brandName"],
        bodyType: ["bodyType"],
        fuelType: ["fuelType"],
        transmission: ["transmission"],
        year: ["minYear", "maxYear"],
      };
      const resetSection = (current: VehicleFilters) => {
        const next = { ...current };
        fieldsBySection[activeFilterSection].forEach((field) => {
          next[field] = "";
        });
        return next;
      };
      setFilters(resetSection);
      setAppliedFilters(resetSection);
      closeFilter();
      return;
    }
    const resetFilters = {
      ...emptyFilters,
      province: selectedLocation?.province || "",
    };
    setFilters(resetFilters);
    setAppliedFilters(resetFilters);
    closeFilter();
  };

  return (
    <div className="min-h-screen bg-gray-100 pb-16 pt-[2rem]">
      <div className="mx-auto max-w-[120rem] px-4 sm:px-6 lg:px-8">
        <section className="rounded-2xl bg-white px-5 py-7 sm:px-7 lg:px-8">
          <nav aria-label="Breadcrumb" className="mb-5">
            <ol className="flex flex-wrap items-center gap-2 text-[1.3rem] text-gray-500">
              <li>
                <Link to="/" className="transition-colors hover:text-amber-600">
                  Trang chủ
                </Link>
              </li>
              <li aria-hidden="true" className="text-[1rem] text-gray-400">
                <FontAwesomeIcon icon={faChevronRight} />
              </li>
              <li>
                {category ? (
                  <Link
                    to="/vehicles"
                    className="transition-colors hover:text-amber-600"
                  >
                    Tìm kiếm xe
                  </Link>
                ) : (
                  <span
                    className="font-medium text-gray-800"
                    aria-current="page"
                  >
                    Tìm kiếm xe
                  </span>
                )}
              </li>
              {category && (
                <>
                  <li aria-hidden="true" className="text-[1rem] text-gray-400">
                    <FontAwesomeIcon icon={faChevronRight} />
                  </li>
                  <li>
                    <span
                      className="font-medium text-gray-800"
                      aria-current={
                        breadcrumbFilters.length === 0 ? "page" : undefined
                      }
                    >
                      {category.name}
                    </span>
                  </li>
                </>
              )}
              {breadcrumbFilters.map((filter, index) => (
                <li key={filter.key} className="contents">
                  <span
                    aria-hidden="true"
                    className="text-[1rem] text-gray-400"
                  >
                    <FontAwesomeIcon icon={faChevronRight} />
                  </span>
                  <span
                    className="font-medium text-gray-800"
                    aria-current={
                      index === breadcrumbFilters.length - 1
                        ? "page"
                        : undefined
                    }
                  >
                    {filter.label}
                  </span>
                </li>
              ))}
            </ol>
          </nav>
          {isLoadingCategory ? (
            <HeadingSkeleton />
          ) : notFound ? (
            <EmptyState
              title="Không tìm thấy danh mục"
              description="Danh mục này không tồn tại hoặc đã ngừng hoạt động."
            />
          ) : (
            <div className="flex items-center gap-4">
              <div className="flex h-30 w-30 shrink-0 items-center justify-center overflow-hidden rounded-2xl text-[2.2rem]">
                {category?.image ? (
                  <img
                    src={category.image}
                    alt={category.name}
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <FontAwesomeIcon icon={category ? faLayerGroup : faCarSide} />
                )}
              </div>
              <div>
                <h1 className="text-[2.2rem] font-medium sm:text-[2.2rem]">
                  {keyword
                    ? `Kết quả tìm kiếm cho "${keyword}"`
                    : category?.name || "Tìm kiếm xe"}
                </h1>
                <p className="mt-1 text-[1.4rem] text-gray-500">
                  {category?.description ||
                    "Khám phá và lọc các tin đăng phù hợp với nhu cầu của bạn"}
                </p>
              </div>
            </div>
          )}
          {!isLoadingCategory && !notFound && (
            <div className="mt-7 flex gap-3 overflow-x-auto pt-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <FilterButton
                label={activeFilterCount ? `Lọc (${activeFilterCount})` : "Lọc"}
                icon={faFilter}
                active={activeFilterCount > 0}
                onClick={openFilter}
              />
              {category && (
                <button
                  type="button"
                  className="relative flex h-14 shrink-0 items-center gap-3 rounded-full border border-amber-300 bg-amber-50 px-8 text-amber-700 transition-colors hover:border-amber-400 hover:bg-amber-100"
                  aria-label={`Xóa danh mục ${category.name}`}
                >
                  {category.name}
                  <div
                    className="absolute top-[-.5rem] right-0 text-[1rem] w-7 h-7 flex items-center justify-center rounded-full bg-gray-700 text-white hover:bg-gray-800"
                    onClick={clearCategory}
                  >
                    <FontAwesomeIcon icon={faXmark} />
                  </div>
                </button>
              )}
              {quickFilters.map((filterKey) => {
                const filter = quickFilterMeta[filterKey];
                const isActive = filter.fields.some((field) =>
                  Boolean(appliedFilters[field]),
                );
                return (
                  <FilterButton
                    key={filterKey}
                    label={filter.label}
                    icon={filter.icon}
                    dropdown
                    active={isActive}
                    onClick={(event) => openQuickFilter(filterKey, event)}
                  />
                );
              })}
            </div>
          )}
          {!isLoadingCategory &&
            !notFound &&
            category &&
            !appliedFilters.brandName && (
              <div className="mt-5 pt-5">
                {isLoadingBrands ? (
                  <div className="flex gap-3 overflow-hidden">
                    {Array.from({ length: 7 }).map((_, index) => (
                      <div
                        key={index}
                        className="h-16 w-36 shrink-0 animate-pulse rounded-xl bg-gray-100"
                      />
                    ))}
                  </div>
                ) : categoryBrands.length > 0 ? (
                  <div className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {categoryBrands.map((brand) => {
                      const isSelected =
                        appliedFilters.brandName === brand.name;
                      return (
                        <button
                          key={brand.id}
                          type="button"
                          onClick={() => selectBrand(brand.name)}
                          className={`flex h-16 shrink-0 items-center gap-3 rounded-full px-5 transition hover:bg-amber-50`}
                          aria-pressed={isSelected}
                        >
                          {brand.logo ? (
                            <img
                              src={brand.logo}
                              alt=""
                              className="h-16 w-16 object-contain"
                            />
                          ) : (
                            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-[1.2rem] font-bold text-gray-500">
                              {brand.name.charAt(0).toUpperCase()}
                            </span>
                          )}
                          {brand.name}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-[1.4rem] text-gray-500">
                    Chưa có hãng xe nào trong danh mục này.
                  </p>
                )}
              </div>
            )}
          {!isLoadingCategory && !notFound && !category && (
            <div className="mt-5 pt-5">
              {categories.length > 0 ? (
                <div className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {categories.slice(0, 5).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => selectCategory(item.slug)}
                      className="flex h-20 shrink-0 items-center gap-3 rounded-full px-5 text-gray-700 transition hover:border-amber-300 hover:bg-amber-50 hover:cursor-pointer"
                    >
                      {item.image ? (
                        <img
                          src={item.image}
                          alt=""
                          className="h-16 w-16 object-contain"
                        />
                      ) : (
                        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                          <FontAwesomeIcon icon={faCarSide} />
                        </span>
                      )}
                      <span>{item.name}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-[1.4rem] text-gray-500">
                  Chưa có danh mục xe nào.
                </p>
              )}
            </div>
          )}
        </section>

        {!notFound && (
          <section className="mt-8 rounded-2xl bg-white p-5 sm:p-7 lg:p-8">
            <div className="mb-5 flex flex-wrap items-center justify-end gap-3">
              <label
                htmlFor="seller-type"
                className="text-[1.4rem] font-medium text-gray-600"
              >
                Người bán
              </label>
              <select
                id="seller-type"
                value={sellerType}
                onChange={(event) => selectSellerType(event.target.value)}
                className="h-16 rounded-xl border border-gray-300 bg-white px-4 text-gray-700 outline-none transition focus:border-amber-400"
              >
                <option value="">Tất cả</option>
                <option value="individual">Cá nhân</option>
                <option value="professional">Người bán chuyên</option>
              </select>
              <label
                htmlFor="post-sort"
                className="text-[1.4rem] font-medium text-gray-600"
              >
                Sắp xếp
              </label>
              <select
                id="post-sort"
                value={postSort}
                onChange={(event) =>
                  selectPostSort(event.target.value as PostSort)
                }
                className="h-16 rounded-xl border border-gray-300 bg-white px-4 text-gray-700 outline-none transition focus:border-amber-400"
              >
                {postSortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <span className="block pl-5 mr-5 h-[3rem] border-r border-r-gray-400"></span>

              <button
                type="button"
                onClick={() =>
                  selectPostView(postView === "grid" ? "list" : "grid")
                }
                className="flex h-16 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-gray-600 transition hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700"
                aria-label={`Chuyển sang ${
                  postView === "grid" ? "dạng danh sách" : "dạng lưới"
                }`}
              >
                {postView === "grid" ? (
                  <>
                    <span>Dạng lưới</span>
                    <FontAwesomeIcon icon={faGrip} />
                  </>
                ) : (
                  <>
                    <span>Dạng danh sách</span>
                    <FontAwesomeIcon icon={faList} />
                  </>
                )}
              </button>
            </div>
            {isLoadingPosts ? (
              <div
                className={
                  postView === "grid"
                    ? "grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                    : "grid gap-5"
                }
              >
                {Array.from({ length: 8 }).map((_, index) => (
                  <PostSkeleton key={index} />
                ))}
              </div>
            ) : posts.length > 0 ? (
              <div
                className={
                  postView === "grid"
                    ? "grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                    : "grid gap-5"
                }
              >
                {posts.map((post) => (
                  <PostCard key={post.id} post={post} layout={postView} />
                ))}
              </div>
            ) : (
              <EmptyState
                title="Chưa có tin đăng"
                description="Hiện chưa có tin đăng nào phù hợp với lựa chọn của bạn."
              />
            )}
          </section>
        )}
      </div>
      {isFilterOpen && (
        <VehicleFilterModal
          filters={filters}
          categorySlug={category?.slug || null}
          filterSection={activeFilterSection}
          popoverPosition={filterPopoverPosition}
          brandOptions={categoryBrands.map((brand) => ({
            value: brand.name,
            label: brand.name,
          }))}
          onChange={handleFilterChange}
          onApply={handleApplyFilters}
          onClose={closeFilter}
          onReset={handleResetFilters}
        />
      )}
    </div>
  );
}

function FilterButton({
  label,
  icon,
  dropdown = false,
  active = false,
  onClick,
}: {
  label: string;
  icon: IconDefinition;
  dropdown?: boolean;
  active?: boolean;
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-14 shrink-0 items-center gap-2 rounded-full border px-8 transition-colors hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700 ${active ? "border-amber-400 bg-amber-50 text-amber-700" : "border-gray-200 bg-white text-gray-700"}`}
    >
      <FontAwesomeIcon icon={icon} />
      {label}
      {dropdown && (
        <FontAwesomeIcon icon={faChevronDown} className="ml-1 text-[1.1rem]" />
      )}
    </button>
  );
}

function HeadingSkeleton() {
  return (
    <div className="flex animate-pulse items-center gap-4">
      <div className="h-20 w-20 shrink-0 rounded-2xl bg-gray-200" />
      <div className="flex-1">
        <div className="h-8 w-52 rounded bg-gray-200" />
        <div className="mt-3 h-4 w-96 max-w-full rounded bg-gray-100" />
      </div>
    </div>
  );
}

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl bg-gray-50 px-6 py-16 text-center">
      <p className="text-[1.8rem] font-semibold text-gray-900">{title}</p>
      <p className="mt-2 text-gray-500">{description}</p>
    </div>
  );
}

export default VehicleSearchPage;
