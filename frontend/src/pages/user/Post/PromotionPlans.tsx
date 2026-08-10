import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import axiosInstance from "../../../configs/axiosInstance";
import MonetizationOffers from "./components/MonetizationOffers";
import type { ListingPost } from "./post.types";

export default function PromotionPlans() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [post, setPost] = useState<ListingPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    axiosInstance
      .get<{ data: ListingPost[] }>("/api/v1/posts/my")
      .then((response) => {
        setPost(
          (response.data.data || []).find((item) => item.id === Number(id)) ||
            null,
        );
      })
      .finally(() => setIsLoading(false));
  }, [id]);

  if (isLoading) return <PromotionPlansSkeleton />;
  if (!post)
    return (
      <div className="min-h-[40rem] p-10 text-center text-gray-500">
        Không tìm thấy tin đăng
      </div>
    );

  const image =
    post.post_images?.find((item) => item.isPrimary)?.imageUrl ||
    post.post_images?.[0]?.imageUrl;

  return (
    <main className="min-h-screen px-[20rem] py-8">
      <section className="mx-auto max-w-[100rem] rounded-2xl border border-gray-200 bg-white p-8">
        <button
          type="button"
          onClick={() => navigate("/posts/manage")}
          className="flex items-center gap-3 text-gray-600 hover:text-gray-900 hover:cursor-pointer"
        >
          <FontAwesomeIcon icon={faArrowLeft} />
          Quay lại quản lý tin
        </button>
        <div className="mt-5">
          <h1 className="mt-4 text-[2.2rem] font-medium">
            Dịch vụ bán nhanh hơn
          </h1>
        </div>
        <div className="mt-7 flex items-center gap-5 rounded-2xl border border-gray-200 bg-gray-50 p-5">
          <div className="h-[11rem] w-[15rem] shrink-0 overflow-hidden rounded-xl border border-gray-200 bg-white">
            {image ? (
              <img
                src={image}
                alt={post.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-gray-400">
                Không có ảnh
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-4">
              <h2 className="truncate font-medium text-gray-900">
                {post.title}
              </h2>
              <span className="shrink-0 rounded-full bg-green-100 px-5 py-2 text-[1.4rem] text-green-700">
                Đang hiển thị
              </span>
            </div>
            <p className="mt-2 text-[2rem] font-semibold text-amber-600">
              {Number(post.price).toLocaleString("vi-VN")}đ
            </p>
            <p className="mt-2 truncate text-gray-600">
              {[
                post.vehicle?.brandName,
                post.vehicle?.modelName,
                post.vehicle?.manufactureYear,
                post.province,
              ]
                .filter(Boolean)
                .join(" • ")}
            </p>
          </div>
        </div>

        <div className="mt-10 font-medium">
          <h4>Đẩy tin đăng</h4>
          <p className="text-[1.4rem] text-gray-600">
            Chọn các gói đẩy tin để tin bạn được nhiều người biết đến
          </p>
        </div>
        <MonetizationOffers
          postId={post.id}
          status={post.status}
          boostOnly
          post={post}
        />
      </section>
    </main>
  );
}

function PromotionPlansSkeleton() {
  return (
    <main className="min-h-screen px-[20rem] py-8">
      <section className="mx-auto max-w-[100rem] rounded-2xl border border-gray-200 bg-white p-8">
        <div className="h-6 w-52 animate-pulse rounded bg-gray-200" />
        <div className="mt-9 h-8 w-72 animate-pulse rounded bg-gray-200" />

        <div className="mt-7 flex items-center gap-5 rounded-2xl border border-gray-200 bg-gray-50 p-5">
          <div className="h-[11rem] w-[15rem] shrink-0 animate-pulse rounded-xl bg-gray-200" />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-4">
              <div className="h-6 w-2/5 animate-pulse rounded bg-gray-200" />
              <div className="h-9 w-32 shrink-0 animate-pulse rounded-full bg-gray-200" />
            </div>
            <div className="mt-4 h-7 w-40 animate-pulse rounded bg-amber-100" />
            <div className="mt-4 h-5 w-3/5 animate-pulse rounded bg-gray-200" />
          </div>
        </div>

        <div className="mt-10 h-6 w-44 animate-pulse rounded bg-gray-200" />
        <div className="mt-3 h-5 w-2/5 animate-pulse rounded bg-gray-100" />

        <div className="mt-6 rounded-xl border border-gray-300 p-5">
          <div className="h-6 w-40 animate-pulse rounded bg-gray-200" />
          <div className="mt-3 h-5 w-72 animate-pulse rounded bg-gray-100" />
          <div className="mt-8 flex gap-6 border-t border-gray-300 pt-8">
            {[0, 1, 2].map((item) => (
              <div
                key={item}
                className="h-[13rem] w-[20rem] animate-pulse rounded-2xl bg-gray-100"
              />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
