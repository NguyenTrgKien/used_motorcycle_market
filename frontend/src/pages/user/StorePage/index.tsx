import {
  faEnvelope,
  faGlobe,
  faLocationDot,
  faPhone,
  faShieldHalved,
  faStore,
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
      <div className="mx-auto min-h-[50rem] max-w-[120rem] px-6 py-10 text-gray-500">
        Đang tải cửa hàng...
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
            <img
              src={store.coverUrl}
              alt={store.storeName}
              className="h-full w-full object-cover"
            />
          )}
        </div>
        <div className="flex flex-wrap items-start gap-6 p-8">
          <div className="-mt-24 flex h-36 w-36 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-4 border-white bg-amber-50 text-amber-600 shadow">
            {store.logoUrl ? (
              <img
                src={store.logoUrl}
                alt={store.storeName}
                className="h-full w-full object-cover"
              />
            ) : (
              <FontAwesomeIcon icon={faStore} className="text-[4rem]" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-[2.8rem] font-semibold text-gray-900">
                {store.storeName}
              </h1>
              <span className="rounded-full bg-green-50 px-3 py-1 text-[1.2rem] font-medium text-green-700">
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
    </div>
  );
}

export default StorePage;
