import {
  faEnvelope,
  faGlobe,
  faLocationDot,
  faPhone,
  faShieldHalved,
  faStore,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import axiosInstance from "../../../configs/axiosInstance";
import PostCard from "../HomePage/components/PostCard";
import type { ListingPost } from "../Post/post.types";

interface StoreInfo {
  id: number;
  userId: number;
  storeName: string;
  description?: string;
  logoUrl?: string;
  coverUrl?: string;
  province: string;
  district: string;
  ward?: string;
  addressDetail: string;
  website?: string;
  verifiedAt: string;
  activePostCount: number;
  phone?: string;
  email?: string;
}

function StorePage() {
  const { id } = useParams();
  const [store, setStore] = useState<StoreInfo | null>(null);
  const [posts, setPosts] = useState<ListingPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [previewImage, setPreviewImage] = useState<{
    url: string;
    alt: string;
  } | null>(null);

  useEffect(() => {
    if (!previewImage) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPreviewImage(null);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [previewImage]);

  useEffect(() => {
    const fetchStore = async () => {
      try {
        const [storeRes, postsRes] = await Promise.all([
          axiosInstance.get<{ data: StoreInfo }>(
            `/api/v1/professional-sellers/${id}`,
          ),
          axiosInstance.get<{ data: ListingPost[] }>(
            `/api/v1/professional-sellers/${id}/posts`,
          ),
        ]);
        setStore(storeRes.data.data);
        setPosts(postsRes.data.data || []);
      } catch (error: any) {
        toast.error(
          error?.response?.data?.message || "Không thể tải thông tin cửa hàng",
        );
      } finally {
        setIsLoading(false);
      }
    };
    if (id) void fetchStore();
  }, [id]);

  if (isLoading) {
    return (
      <div
        aria-label="Đang tải cửa hàng"
        className="mx-auto w-full max-w-[120rem] animate-pulse px-6 py-10"
      >
        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
          <div className="h-64 bg-gray-200" />
          <div className="flex flex-wrap items-start gap-6 p-8">
            <div className="-mt-24 h-36 w-36 shrink-0 rounded-2xl border-4 border-white bg-gray-200 shadow" />
            <div className="min-w-[28rem] flex-1 space-y-4">
              <div className="h-9 w-72 rounded-lg bg-gray-200" />
              <div className="h-5 w-full max-w-[48rem] rounded bg-gray-200" />
              <div className="h-5 w-full max-w-[68rem] rounded bg-gray-200" />
            </div>
            <div className="w-64 space-y-3">
              <div className="h-5 w-full rounded bg-gray-200" />
              <div className="h-5 w-4/5 rounded bg-gray-200" />
              <div className="h-5 w-3/5 rounded bg-gray-200" />
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-2xl bg-white p-8">
          <div className="h-8 w-48 rounded-lg bg-gray-200" />
          <div className="mt-3 h-5 w-64 rounded bg-gray-200" />
          <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div
                key={index}
                className="overflow-hidden rounded-2xl border border-gray-200"
              >
                <div className="aspect-[4/3] bg-gray-200" />
                <div className="space-y-3 p-5">
                  <div className="h-6 w-4/5 rounded bg-gray-200" />
                  <div className="h-5 w-1/2 rounded bg-gray-200" />
                  <div className="h-5 w-2/3 rounded bg-gray-200" />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="mx-auto min-h-[50rem] max-w-[120rem] px-6 py-10">
        Không tìm thấy cửa hàng.
      </div>
    );
  }

  const address = [
    store.addressDetail,
    store.ward,
    store.district,
    store.province,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="mx-auto w-full max-w-[120rem] px-6 py-10">
      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <div className="h-64 bg-gradient-to-r from-amber-100 to-orange-100">
          {store.coverUrl && (
            <button
              type="button"
              aria-label="Xem ảnh bìa cửa hàng"
              onClick={() =>
                setPreviewImage({
                  url: store.coverUrl!,
                  alt: `Ảnh bìa cửa hàng ${store.storeName}`,
                })
              }
              className="group relative block h-full w-full cursor-zoom-in"
            >
              <img
                src={store.coverUrl}
                alt={`Ảnh bìa cửa hàng ${store.storeName}`}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
              />
              <span className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/10" />
            </button>
          )}
        </div>
        <div className="flex flex-wrap items-start gap-6 p-8">
          <div className="relative z-10 -mt-24 flex h-36 w-36 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-4 border-white bg-amber-50 text-amber-600 shadow">
            {store.logoUrl ? (
              <button
                type="button"
                aria-label="Xem logo cửa hàng"
                onClick={() =>
                  setPreviewImage({
                    url: store.logoUrl!,
                    alt: `Logo cửa hàng ${store.storeName}`,
                  })
                }
                className="relative z-10 block h-full w-full cursor-zoom-in"
              >
                <img
                  src={store.logoUrl}
                  alt={`Logo cửa hàng ${store.storeName}`}
                  className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                />
              </button>
            ) : (
              <FontAwesomeIcon icon={faStore} className="text-[4rem]" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-[2.8rem] font-semibold text-gray-900">
                {store.storeName}
              </h1>
              <span className="rounded-full bg-green-50 px-3 py-1 text-[1.4rem] font-medium text-green-700">
                <FontAwesomeIcon icon={faShieldHalved} className="mr-2" />
                Người bán chuyên đã xác minh
              </span>
            </div>
            <p className="mt-3 flex items-start gap-2 text-[1.4rem] text-gray-500">
              <FontAwesomeIcon icon={faLocationDot} className="mt-1" />
              {address}
            </p>
            {store.description && (
              <p className="mt-4 max-w-[75rem] text-[1.5rem] leading-relaxed text-gray-600">
                {store.description}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-2 text-[1.4rem]">
            {store.phone && (
              <a href={`tel:${store.phone}`} className="text-gray-700">
                <FontAwesomeIcon
                  icon={faPhone}
                  className="mr-3 text-amber-500"
                />
                {store.phone}
              </a>
            )}
            {store.email && (
              <a href={`mailto:${store.email}`} className="text-gray-700">
                <FontAwesomeIcon
                  icon={faEnvelope}
                  className="mr-3 text-amber-500"
                />
                {store.email}
              </a>
            )}
            {store.website && (
              <a
                href={store.website}
                target="_blank"
                rel="noreferrer"
                className="text-gray-700"
              >
                <FontAwesomeIcon
                  icon={faGlobe}
                  className="mr-3 text-amber-500"
                />
                Website
              </a>
            )}
          </div>
        </div>
      </section>

      <section className="mt-8 rounded-2xl bg-white p-8">
        <div className="mb-6">
          <h2 className="text-[2.2rem] font-semibold text-gray-900">
            Xe đang bán
          </h2>
          <p className="mt-1 text-[1.4rem] text-gray-500">
            {store.activePostCount} tin đăng đang hoạt động
          </p>
        </div>
        {posts.length ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <div className="py-20 text-center text-gray-500">
            Cửa hàng chưa có xe đang bán.
          </div>
        )}
      </section>

      {previewImage && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={previewImage.alt}
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/80 p-5 backdrop-blur-sm"
        >
          <button
            type="button"
            aria-label="Đóng ảnh"
            onClick={() => setPreviewImage(null)}
            className="absolute right-6 top-6 flex h-16 w-16 items-center justify-center rounded-full bg-white/15 text-[2rem] text-white transition-colors hover:bg-white/25"
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
          <div
            onClick={(event) => event.stopPropagation()}
            className="flex max-h-[90vh] max-w-[120rem] items-center justify-center overflow-hidden rounded-2xl bg-white shadow-2xl"
          >
            <img
              src={previewImage.url}
              alt={previewImage.alt}
              className="max-h-[90vh] max-w-full object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default StorePage;
