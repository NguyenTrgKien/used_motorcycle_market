import {
  faBan,
  faCheck,
  faImage,
  faLayerGroup,
  faPen,
  faPlus,
  faRotateRight,
  faTag,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { toast } from "react-toastify";
import axiosInstance from "../../../configs/axiosInstance";
import { CategoryStatus } from "../../../shared";

interface CatalogCategory {
  id: number;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  imagePublicId?: string;
  status: CategoryStatus;
}

interface VehicleBrand {
  id: number;
  name: string;
  slug: string;
  logo?: string;
  publicId?: string;
  country?: string;
  isActive: boolean;
  categories?: CatalogCategory[];
}

interface CategoriesResponse {
  data: CatalogCategory[];
}

interface BrandsResponse {
  data: VehicleBrand[];
}

const emptyCategoryForm = {
  name: "",
  description: "",
};

const emptyBrandForm = {
  name: "",
  country: "",
  categoryIds: [] as number[],
};

function AdminCatalog() {
  const [activeTab, setActiveTab] = useState<"categories" | "brands">(
    "categories",
  );
  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [brands, setBrands] = useState<VehicleBrand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [editingCategory, setEditingCategory] =
    useState<CatalogCategory | null>(null);
  const [editingBrand, setEditingBrand] = useState<VehicleBrand | null>(null);
  const [categoryForm, setCategoryForm] = useState(emptyCategoryForm);
  const [brandForm, setBrandForm] = useState(emptyBrandForm);
  const [brandLogoFile, setBrandLogoFile] = useState<File | null>(null);
  const [categoryImageFile, setCategoryImageFile] = useState<File | null>(null);
  const [removeCategoryImage, setRemoveCategoryImage] = useState(false);

  const activeCategoryCount = useMemo(
    () =>
      categories.filter((category) => category.status === CategoryStatus.ACTIVE)
        .length,
    [categories],
  );

  const activeBrandCount = useMemo(
    () => brands.filter((brand) => brand.isActive).length,
    [brands],
  );

  const fetchCatalog = async () => {
    try {
      setIsLoading(true);
      const [categoryRes, brandRes] = await Promise.all([
        axiosInstance.get<CategoriesResponse>("/api/v1/categories"),
        axiosInstance.get<BrandsResponse>("/api/v1/vehicle/brands"),
      ]);

      setCategories(categoryRes.data.data || []);
      setBrands(brandRes.data.data || []);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Không thể tải dữ liệu danh mục",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchCatalog();
  }, []);

  const resetCategoryForm = () => {
    setEditingCategory(null);
    setCategoryForm(emptyCategoryForm);
    setCategoryImageFile(null);
    setRemoveCategoryImage(false);
  };

  const resetBrandForm = () => {
    setEditingBrand(null);
    setBrandForm(emptyBrandForm);
    setBrandLogoFile(null);
  };

  const handleEditCategory = (category: CatalogCategory) => {
    setActiveTab("categories");
    setEditingCategory(category);
    setCategoryForm({
      name: category.name,
      description: category.description || "",
    });
    setCategoryImageFile(null);
    setRemoveCategoryImage(false);
  };

  const handleEditBrand = (brand: VehicleBrand) => {
    setActiveTab("brands");
    setEditingBrand(brand);
    setBrandForm({
      name: brand.name,
      country: brand.country || "",
      categoryIds: brand.categories?.map((category) => category.id) || [],
    });
    setBrandLogoFile(null);
  };

  const handleSubmitCategory = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = categoryForm.name.trim();

    if (!name) {
      toast.error("Vui lòng nhập tên danh mục");
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = new FormData();
      payload.append("name", name);
      if (categoryForm.description.trim()) {
        payload.append("description", categoryForm.description.trim());
      }
      if (categoryImageFile) {
        payload.append("image", categoryImageFile);
      }
      if (removeCategoryImage) {
        payload.append("removeImage", "true");
      }
      const res = editingCategory
        ? await axiosInstance.post(
            `/api/v1/categories/update/${editingCategory.id}`,
            payload,
            { headers: { "Content-Type": "multipart/form-data" } },
          )
        : await axiosInstance.post("/api/v1/categories/create", payload, {
            headers: { "Content-Type": "multipart/form-data" },
          });

      toast.success(
        res.data.message ||
          (editingCategory ? "Đã cập nhật danh mục" : "Đã thêm danh mục mới"),
      );
      resetCategoryForm();
      await fetchCatalog();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Không thể lưu danh mục");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitBrand = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = brandForm.name.trim();

    if (!name) {
      toast.error("Vui lòng nhập tên hãng xe");
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = new FormData();
      payload.append("name", name);
      if (brandForm.country.trim()) {
        payload.append("country", brandForm.country.trim());
      }
      payload.append("categoryIds", JSON.stringify(brandForm.categoryIds));
      if (brandLogoFile) {
        payload.append("logo", brandLogoFile);
      }
      const res = editingBrand
        ? await axiosInstance.patch(
            `/api/v1/vehicle/brands/${editingBrand.id}`,
            payload,
            { headers: { "Content-Type": "multipart/form-data" } },
          )
        : await axiosInstance.post("/api/v1/vehicle/brands", payload, {
            headers: { "Content-Type": "multipart/form-data" },
          });

      toast.success(
        res.data.message ||
          (editingBrand ? "Đã cập nhật hãng xe" : "Đã thêm hãng xe mới"),
      );
      resetBrandForm();
      await fetchCatalog();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Không thể lưu hãng xe");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleCategory = async (category: CatalogCategory) => {
    try {
      setUpdatingId(category.id);
      const res = await axiosInstance.patch(
        `/api/v1/categories/${category.id}/toggle-active`,
      );
      toast.success(res.data.message || "Đã cập nhật trạng thái danh mục");
      await fetchCatalog();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          "Không thể cập nhật trạng thái danh mục",
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const handleToggleBrand = async (brand: VehicleBrand) => {
    try {
      setUpdatingId(brand.id);
      const res = await axiosInstance.patch(
        `/api/v1/vehicle/brands/${brand.id}/toggle-active`,
      );
      toast.success(res.data.message || "Đã cập nhật trạng thái hãng xe");
      await fetchCatalog();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          "Không thể cập nhật trạng thái hãng xe",
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const toggleBrandCategory = (categoryId: number) => {
    setBrandForm((prev) => ({
      ...prev,
      categoryIds: prev.categoryIds.includes(categoryId)
        ? prev.categoryIds.filter((id) => id !== categoryId)
        : [...prev.categoryIds, categoryId],
    }));
  };

  return (
    <section className="px-5 py-6 md:px-8">
      <div className="grid gap-5 lg:grid-cols-3">
        <StatCard
          label="Danh mục"
          value={categories.length}
          helper={`${activeCategoryCount} đang hoạt động`}
        />
        <StatCard
          label="Hãng xe"
          value={brands.length}
          helper={`${activeBrandCount} đang hoạt động`}
        />
        <div className="rounded-lg border border-gray-300 bg-white p-5">
          <p className="text-[1.3rem] font-semibold uppercase text-gray-500">
            Đồng bộ dữ liệu
          </p>
          <button
            type="button"
            onClick={() => void fetchCatalog()}
            className="mt-3 flex h-14 items-center justify-center gap-3 rounded-lg border border-gray-300 px-5 font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            <FontAwesomeIcon icon={faRotateRight} />
            Tải lại
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_42rem]">
        <div className="rounded-lg border border-gray-300 bg-white">
          <div className="flex flex-wrap gap-3 border-b border-gray-200 p-5">
            <TabButton
              active={activeTab === "categories"}
              label="Danh mục"
              icon={faLayerGroup}
              onClick={() => setActiveTab("categories")}
            />
            <TabButton
              active={activeTab === "brands"}
              label="Hãng xe"
              icon={faTag}
              onClick={() => setActiveTab("brands")}
            />
          </div>

          {isLoading ? (
            <CatalogSkeleton />
          ) : activeTab === "categories" ? (
            <div className="divide-y divide-gray-100">
              {categories.map((category) => (
                <article
                  key={category.id}
                  className="grid gap-4 p-5 lg:grid-cols-[1fr_14rem_18rem] lg:items-center"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-3">
                      <CategoryThumbnail category={category} />
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-gray-950">
                          {category.name}
                        </p>
                        <p className="truncate text-[1.3rem] text-gray-500">
                          {category.slug}
                        </p>
                      </div>
                    </div>
                    <p className="mt-3 line-clamp-2 text-[1.35rem] text-gray-600">
                      {category.description || "Chưa có mô tả"}
                    </p>
                  </div>

                  <StatusBadge
                    active={category.status === CategoryStatus.ACTIVE}
                  />

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleEditCategory(category)}
                      className="flex h-16 flex-1 items-center justify-center gap-2 rounded-lg border border-blue-200 text-blue-700 transition-colors hover:bg-blue-50"
                    >
                      <FontAwesomeIcon icon={faPen} />
                      Sửa
                    </button>
                    <button
                      type="button"
                      disabled={updatingId === category.id}
                      onClick={() => void handleToggleCategory(category)}
                      className="flex h-16 flex-1 items-center justify-center gap-2 rounded-lg border border-gray-300 text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <FontAwesomeIcon
                        icon={
                          category.status === CategoryStatus.ACTIVE
                            ? faBan
                            : faCheck
                        }
                      />
                      {category.status === CategoryStatus.ACTIVE
                        ? "Tắt"
                        : "Bật"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {brands.map((brand) => (
                <article
                  key={brand.id}
                  className="grid gap-4 p-5 lg:grid-cols-[1fr_14rem_18rem] lg:items-center"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-3">
                      <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg text-white">
                        {brand.logo ? (
                          <img
                            src={brand.logo}
                            alt={brand.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          brand.name.slice(0, 2).toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-gray-950">
                          {brand.name}
                        </p>
                        <p className="truncate text-[1.3rem] text-gray-500">
                          {brand.country || brand.slug}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {brand.categories?.length ? (
                        brand.categories.map((category) => (
                          <span
                            key={category.id}
                            className="rounded-full bg-gray-100 px-3 py-1 text-[1.2rem] text-gray-600"
                          >
                            {category.name}
                          </span>
                        ))
                      ) : (
                        <span className="text-[1.3rem] text-gray-500">
                          Chưa gắn danh mục
                        </span>
                      )}
                    </div>
                  </div>

                  <StatusBadge active={brand.isActive} />

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleEditBrand(brand)}
                      className="flex h-16 flex-1 items-center justify-center gap-2 rounded-lg border border-blue-200 text-blue-700 transition-colors hover:bg-blue-50"
                    >
                      <FontAwesomeIcon icon={faPen} />
                      Sửa
                    </button>
                    <button
                      type="button"
                      disabled={updatingId === brand.id}
                      onClick={() => void handleToggleBrand(brand)}
                      className="flex h-16 flex-1 items-center justify-center gap-2 rounded-lg border border-gray-300 text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <FontAwesomeIcon
                        icon={brand.isActive ? faBan : faCheck}
                      />
                      {brand.isActive ? "Tắt" : "Bật"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        <aside className="rounded-lg border border-gray-300 bg-white p-5">
          {activeTab === "categories" ? (
            <form onSubmit={handleSubmitCategory}>
              <FormHeader
                title={editingCategory ? "Sửa danh mục" : "Thêm danh mục"}
                onReset={resetCategoryForm}
                isEditing={Boolean(editingCategory)}
              />
              <Field label="Tên danh mục">
                <input
                  value={categoryForm.name}
                  onChange={(e) =>
                    setCategoryForm((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  className="field-input"
                  placeholder="Ví dụ: Xe máy"
                />
              </Field>
              <Field label="Mô tả">
                <textarea
                  value={categoryForm.description}
                  onChange={(e) =>
                    setCategoryForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  rows={4}
                  className="field-input h-auto resize-none"
                  placeholder="Mô tả ngắn về danh mục"
                />
              </Field>
              <Field label="Ảnh danh mục (không bắt buộc)">
                <ImageUploadField
                  file={categoryImageFile}
                  currentImage={
                    removeCategoryImage ? undefined : editingCategory?.image
                  }
                  alt={editingCategory?.name || categoryForm.name || "Danh mục"}
                  onChange={(file) => {
                    setCategoryImageFile(file);
                    if (file) setRemoveCategoryImage(false);
                  }}
                  onRemove={() => {
                    setCategoryImageFile(null);
                    setRemoveCategoryImage(Boolean(editingCategory?.image));
                  }}
                />
              </Field>
              <SubmitButton
                isSubmitting={isSubmitting}
                editing={Boolean(editingCategory)}
                heightClass="h-18"
              />
            </form>
          ) : (
            <form onSubmit={handleSubmitBrand}>
              <FormHeader
                title={editingBrand ? "Sửa hãng xe" : "Thêm hãng xe"}
                onReset={resetBrandForm}
                isEditing={Boolean(editingBrand)}
              />
              <Field label="Tên hãng xe">
                <input
                  value={brandForm.name}
                  onChange={(e) =>
                    setBrandForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="field-input"
                  placeholder="Ví dụ: Honda"
                />
              </Field>
              <Field label="Logo hãng xe">
                <div className="space-y-3">
                  {(brandLogoFile || editingBrand?.logo) && (
                    <div className="flex items-center gap-3 rounded-lg border border-gray-200 p-3">
                      <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-lg bg-gray-950 text-white">
                        {brandLogoFile ? (
                          <img
                            src={URL.createObjectURL(brandLogoFile)}
                            alt="Logo mới"
                            className="h-full w-full object-cover"
                          />
                        ) : editingBrand?.logo ? (
                          <img
                            src={editingBrand.logo}
                            alt={editingBrand.name}
                            className="h-full w-full object-cover"
                          />
                        ) : null}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900">
                          {brandLogoFile?.name || "Logo hiện tại"}
                        </p>
                        <p className="text-[1.25rem] text-gray-500">
                          Ảnh sẽ được tải lên Cloudinary
                        </p>
                      </div>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      setBrandLogoFile(e.target.files?.[0] || null)
                    }
                    className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-[1.4rem] text-gray-700 file:mr-4 file:rounded-lg file:border-0 file:bg-gray-950 file:px-4 file:py-2 file:text-white"
                  />
                </div>
              </Field>
              <Field label="Quốc gia">
                <input
                  value={brandForm.country}
                  onChange={(e) =>
                    setBrandForm((prev) => ({
                      ...prev,
                      country: e.target.value,
                    }))
                  }
                  className="field-input"
                  placeholder="Ví dụ: Nhật Bản"
                />
              </Field>
              <Field label="Danh mục áp dụng">
                <div className="grid gap-2">
                  {categories.map((category) => (
                    <label
                      key={category.id}
                      className="flex h-20 items-center gap-3 rounded-lg border border-gray-200 px-4 text-[1.4rem] text-gray-700"
                    >
                      <input
                        type="checkbox"
                        checked={brandForm.categoryIds.includes(category.id)}
                        onChange={() => toggleBrandCategory(category.id)}
                        className="h-5 w-5"
                      />
                      {category.name}
                    </label>
                  ))}
                </div>
              </Field>
              <SubmitButton
                isSubmitting={isSubmitting}
                editing={Boolean(editingBrand)}
                heightClass="h-20"
              />
            </form>
          )}
        </aside>
      </div>
    </section>
  );
}

function CategoryThumbnail({ category }: { category: CatalogCategory }) {
  return (
    <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg ">
      {category.image ? (
        <img
          src={category.image}
          alt={category.name}
          className="h-full w-full object-cover"
        />
      ) : (
        <FontAwesomeIcon icon={faLayerGroup} />
      )}
    </div>
  );
}

function ImageUploadField({
  file,
  currentImage,
  alt,
  onChange,
  onRemove,
}: {
  file: File | null;
  currentImage?: string;
  alt: string;
  onChange: (file: File | null) => void;
  onRemove: () => void;
}) {
  const [preview, setPreview] = useState<string | undefined>(currentImage);

  useEffect(() => {
    if (!file) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPreview(currentImage);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file, currentImage]);

  return (
    <div className="space-y-3">
      {preview && (
        <div className="flex items-center gap-3 rounded-lg border border-gray-200 p-3">
          <img
            src={preview}
            alt={alt}
            className="h-16 w-16 rounded-lg object-cover"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-gray-900">
              {file?.name || "Ảnh hiện tại"}
            </p>
            <p className="text-[1.25rem] text-gray-500">
              Ảnh sẽ được lưu trên Cloudinary
            </p>
          </div>
          <button
            type="button"
            onClick={onRemove}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
            aria-label="Xóa ảnh"
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>
      )}
      <label className="flex h-18 cursor-pointer items-center justify-center gap-3 rounded-lg border border-dashed border-gray-300 px-4 text-[1.4rem] text-gray-600 transition-colors hover:border-amber-400 hover:text-amber-700">
        <FontAwesomeIcon icon={faImage} />
        {preview ? "Chọn ảnh khác" : "Chọn ảnh từ thiết bị"}
        <input
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(event) => onChange(event.target.files?.[0] || null)}
        />
      </label>
    </div>
  );
}

function StatCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: number;
  helper: string;
}) {
  return (
    <div className="rounded-lg border border-gray-300 bg-white p-5">
      <p className="text-[1.3rem] font-semibold uppercase text-gray-500">
        {label}
      </p>
      <p className="mt-2 text-[2.8rem] font-semibold">{value}</p>
      <p className="mt-1 text-[1.3rem] text-gray-500">{helper}</p>
    </div>
  );
}

function TabButton({
  active,
  label,
  icon,
  onClick,
}: {
  active: boolean;
  label: string;
  icon: any;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-16 items-center gap-3 rounded-lg px-5 font-medium transition-colors ${
        active
          ? "bg-gray-950 text-white"
          : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
      }`}
    >
      <FontAwesomeIcon icon={icon} />
      {label}
    </button>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex w-fit rounded-full px-4 py-2 text-[1.3rem] font-medium ${
        active ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"
      }`}
    >
      {active ? "Đang hoạt động" : "Đã tắt"}
    </span>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="mt-5 block">
      <span className="text-[1.3rem] font-semibold text-gray-600">{label}</span>
      <div className="mt-2">{children}</div>
    </label>
  );
}

function FormHeader({
  title,
  isEditing,
  onReset,
}: {
  title: string;
  isEditing: boolean;
  onReset: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h2 className="text-[2rem] font-semibold text-gray-950">{title}</h2>
        <p className="mt-1 text-[1.3rem] text-gray-500">
          {isEditing
            ? "Cập nhật dữ liệu hiện có"
            : "Tạo dữ liệu mới cho hệ thống"}
        </p>
      </div>
      {isEditing && (
        <button
          type="button"
          onClick={onReset}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-300 text-gray-500 transition-colors hover:bg-gray-50"
        >
          <FontAwesomeIcon icon={faXmark} />
        </button>
      )}
    </div>
  );
}

function SubmitButton({
  isSubmitting,
  editing,
  heightClass = "h-14",
}: {
  isSubmitting: boolean;
  editing: boolean;
  heightClass?: string;
}) {
  return (
    <button
      type="submit"
      disabled={isSubmitting}
      className={`mt-6 flex ${heightClass} w-full items-center justify-center gap-3 rounded-lg ${isSubmitting ? "bg-blue-500 hover:bg-blue-600" : "bg-amber-500 hover:bg-amber-600"} font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-60`}
    >
      <FontAwesomeIcon icon={faPlus} />
      {isSubmitting ? "Đang lưu..." : editing ? "Lưu thay đổi" : "Thêm mới"}
    </button>
  );
}

function CatalogSkeleton() {
  return (
    <div className="divide-y divide-gray-100">
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={index}
          className="grid gap-4 p-5 lg:grid-cols-[1fr_14rem_18rem] lg:items-center"
        >
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 animate-pulse rounded-lg bg-gray-200" />
            <div className="flex-1 space-y-2">
              <div className="h-5 w-40 animate-pulse rounded bg-gray-200" />
              <div className="h-4 w-64 animate-pulse rounded bg-gray-100" />
            </div>
          </div>
          <div className="h-8 w-28 animate-pulse rounded-full bg-gray-200" />
          <div className="h-12 w-full animate-pulse rounded-lg bg-gray-100" />
        </div>
      ))}
    </div>
  );
}

export default AdminCatalog;
