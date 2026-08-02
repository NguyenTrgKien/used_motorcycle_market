import {
  faHeart,
  faLocationDot,
  faTrashCan,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import axiosInstance from "../../configs/axiosInstance";
import type { ListingPost } from "./Post/post.types";

interface SavedListingItem {
  id: number;
  savedAt: string;
  post: ListingPost;
}

function SaveListing() {
  const [items, setItems] = useState<SavedListingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [removingPostId, setRemovingPostId] = useState<number | null>(null);

  const total = useMemo(() => items.length, [items]);

  useEffect(() => {
    const fetchSavedPosts = async () => {
      try {
        setIsLoading(true);
        const res = await axiosInstance.get<{ data: SavedListingItem[] }>(
          "/api/v1/saved-post",
        );
        setItems(res.data.data || []);
      } catch (error: any) {
        toast.error(
          error?.response?.data?.message ||
            "Không thể tải danh sách tin yêu thích",
        );
      } finally {
        setIsLoading(false);
      }
    };

    void fetchSavedPosts();
  }, []);

  const handleRemove = async (postId: number) => {
    try {
      setRemovingPostId(postId);
      const res = await axiosInstance.delete(`/api/v1/saved-post/${postId}`);
      setItems((prev) => prev.filter((item) => item.post.id !== postId));
      toast.success(res.data.message || "Đã bỏ tin khỏi yêu thích");
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Không thể bỏ tin khỏi yêu thích",
      );
    } finally {
      setRemovingPostId(null);
    }
  };

  return (
    <main className="mx-auto w-full px-[20rem] pb-12 pt-8">
      <div className="rounded-xl border border-gray-200 bg-white p-8">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-gray-100 pb-6">
        <div>
          <h1 className="text-[2.2rem] font-semibold text-gray-900">
            Tin đã lưu
          </h1>
          <p className="mt-2 text-gray-500">
            {total} tin đang nằm trong danh sách yêu thích của bạn
          </p>
        </div>
        <span className="inline-flex h-12 items-center gap-3 rounded-full bg-red-50 px-5 font-medium text-red-600">
          <FontAwesomeIcon icon={faHeart} />
          {total}
        </span>
      </div>

      {isLoading ? (
        <div className="mt-8 space-y-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <SavedPostSkeleton key={index} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex min-h-[36rem] flex-col items-center justify-center text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-50 text-red-500">
            <FontAwesomeIcon icon={faHeart} className="text-[2.8rem]" />
          </div>
          <h2 className="mt-5 text-[2rem] font-semibold text-gray-900">
            Bạn chưa lưu tin nào
          </h2>
          <p className="mt-2 max-w-[42rem] text-gray-500">
            Khi thấy một tin đăng phù hợp, bấm lưu để xem lại nhanh hơn tại đây.
          </p>
          <Link
            to="/"
            className="mt-6 flex h-18 items-center rounded-xl bg-amber-500 px-6 font-medium text-white transition-colors hover:bg-amber-600"
          >
            Khám phá tin đăng
          </Link>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {items.map((item) => (
            <SavedPostCard
              key={item.id}
              item={item}
              isRemoving={removingPostId === item.post.id}
              onRemove={handleRemove}
            />
          ))}
        </div>
      )}
      </div>
    </main>
  );
}

function SavedPostCard({
  item,
  isRemoving,
  onRemove,
}: {
  item: SavedListingItem;
  isRemoving: boolean;
  onRemove: (postId: number) => void;
}) {
  const { post } = item;
  const image =
    post.post_images?.find((postImage) => postImage.isPrimary)?.imageUrl ||
    [...(post.post_images || [])].sort((a, b) => a.sortOrder - b.sortOrder)[0]
      ?.imageUrl;
  const address = [post.ward, post.district, post.province]
    .filter(Boolean)
    .join(", ");
  const savedAt = new Date(item.savedAt).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return (
    <article className="flex gap-5 rounded-xl border border-gray-200 bg-white p-4 transition-colors hover:border-amber-200">
      <Link
        to={`/posts/${post.slug}`}
        className="h-[13rem] w-[18rem] shrink-0 overflow-hidden rounded-lg bg-gray-100"
      >
        {image ? (
          <img
            src={image}
            alt={post.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-gray-400">
            Không có ảnh
          </div>
        )}
      </Link>

      <div className="min-w-0 flex-1">
        <Link
          to={`/posts/${post.slug}`}
          className="line-clamp-2 text-[1.8rem] font-semibold text-gray-900 transition-colors hover:text-amber-600"
        >
          {post.title}
        </Link>
        <p className="mt-2 text-[2rem] font-semibold text-amber-600">
          {Number(post.price).toLocaleString("vi-VN")} đ
        </p>
        {address && (
          <p className="mt-3 flex items-center gap-2 text-[1.4rem] text-gray-500">
            <FontAwesomeIcon icon={faLocationDot} />
            <span className="truncate">{address}</span>
          </p>
        )}
        <p className="mt-3 text-[1.3rem] text-gray-400">Đã lưu {savedAt}</p>
      </div>

      <button
        type="button"
        onClick={() => onRemove(post.id)}
        disabled={isRemoving}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-60"
        title="Bỏ lưu"
      >
        <FontAwesomeIcon icon={faTrashCan} />
      </button>
    </article>
  );
}

function SavedPostSkeleton() {
  return (
    <div className="flex gap-5 rounded-xl border border-gray-200 bg-white p-4">
      <div className="h-[13rem] w-[18rem] shrink-0 animate-pulse rounded-lg bg-gray-200" />
      <div className="flex-1 space-y-3">
        <div className="h-6 w-4/5 animate-pulse rounded bg-gray-200" />
        <div className="h-6 w-40 animate-pulse rounded bg-amber-100" />
        <div className="h-4 w-2/3 animate-pulse rounded bg-gray-100" />
        <div className="h-4 w-28 animate-pulse rounded bg-gray-100" />
      </div>
      <div className="h-11 w-11 shrink-0 animate-pulse rounded-full bg-gray-100" />
    </div>
  );
}

export default SaveListing;
