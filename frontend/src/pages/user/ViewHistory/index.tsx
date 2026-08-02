import {
  faClockRotateLeft,
  faLocationDot,
  faTrashCan,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import axiosInstance from "../../../configs/axiosInstance";
import type { ListingPost } from "../Post/post.types";

interface ViewHistoryItem {
  id: number;
  viewedAt: string;
  post: ListingPost;
}

function ViewHistory() {
  const [items, setItems] = useState<ViewHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [removingPostId, setRemovingPostId] = useState<number | null>(null);
  const [isClearing, setIsClearing] = useState(false);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await axiosInstance.get<{ data: ViewHistoryItem[] }>(
          "/api/v1/view-history",
        );
        setItems(res.data.data || []);
      } catch (error: any) {
        toast.error(
          error?.response?.data?.message || "Không thể tải lịch sử xem tin",
        );
      } finally {
        setIsLoading(false);
      }
    };

    void fetchHistory();
  }, []);

  const handleRemove = async (postId: number) => {
    try {
      setRemovingPostId(postId);
      const res = await axiosInstance.delete(
        `/api/v1/view-history/${postId}`,
      );
      setItems((current) =>
        current.filter((item) => item.post.id !== postId),
      );
      toast.success(res.data.message || "Đã xóa tin khỏi lịch sử");
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Không thể xóa tin khỏi lịch sử",
      );
    } finally {
      setRemovingPostId(null);
    }
  };

  const handleClear = async () => {
    if (!window.confirm("Bạn có chắc muốn xóa toàn bộ lịch sử xem tin?")) return;

    try {
      setIsClearing(true);
      const res = await axiosInstance.delete("/api/v1/view-history");
      setItems([]);
      toast.success(res.data.message || "Đã xóa toàn bộ lịch sử xem tin");
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Không thể xóa lịch sử xem tin",
      );
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[120rem] px-6 py-10">
      <div className="rounded-2xl bg-white p-8 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-gray-100 pb-6">
          <div>
            <h1 className="text-[2.4rem] font-semibold text-gray-900">
              Lịch sử xem tin
            </h1>
            <p className="mt-2 text-[1.4rem] text-gray-500">
              {items.length} tin bạn đã xem gần đây
            </p>
          </div>
          {items.length > 0 && (
            <button
              type="button"
              onClick={handleClear}
              disabled={isClearing}
              className="flex h-12 items-center gap-2 rounded-xl border border-red-200 px-5 text-[1.4rem] font-medium text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <FontAwesomeIcon icon={faTrashCan} />
              {isClearing ? "Đang xóa..." : "Xóa tất cả"}
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="mt-8 space-y-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <HistorySkeleton key={index} />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex min-h-[42rem] flex-col items-center justify-center text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-amber-50 text-amber-500">
              <FontAwesomeIcon
                icon={faClockRotateLeft}
                className="text-[2.8rem]"
              />
            </div>
            <h2 className="mt-5 text-[2rem] font-semibold text-gray-900">
              Bạn chưa xem tin nào
            </h2>
            <p className="mt-2 max-w-[42rem] text-[1.4rem] text-gray-500">
              Những tin đăng bạn đã mở xem sẽ xuất hiện tại đây.
            </p>
            <Link
              to="/"
              className="mt-6 flex h-12 items-center rounded-xl bg-amber-500 px-6 text-[1.4rem] font-medium text-white transition-colors hover:bg-amber-600"
            >
              Khám phá tin đăng
            </Link>
          </div>
        ) : (
          <div className="mt-8 space-y-4">
            {items.map((item) => (
              <HistoryCard
                key={item.id}
                item={item}
                isRemoving={removingPostId === item.post.id}
                onRemove={handleRemove}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function HistoryCard({
  item,
  isRemoving,
  onRemove,
}: {
  item: ViewHistoryItem;
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
  const viewedAt = new Date(item.viewedAt).toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
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
          <div className="flex h-full items-center justify-center text-gray-400">
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
        <p className="mt-3 text-[1.3rem] text-gray-400">Đã xem {viewedAt}</p>
      </div>

      <button
        type="button"
        onClick={() => onRemove(post.id)}
        disabled={isRemoving}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-60"
        title="Xóa khỏi lịch sử"
      >
        <FontAwesomeIcon icon={faTrashCan} />
      </button>
    </article>
  );
}

function HistorySkeleton() {
  return (
    <div className="flex gap-5 rounded-xl border border-gray-200 bg-white p-4">
      <div className="h-[13rem] w-[18rem] shrink-0 animate-pulse rounded-lg bg-gray-200" />
      <div className="flex-1 space-y-3">
        <div className="h-6 w-4/5 animate-pulse rounded bg-gray-200" />
        <div className="h-6 w-40 animate-pulse rounded bg-amber-100" />
        <div className="h-4 w-2/3 animate-pulse rounded bg-gray-100" />
        <div className="h-4 w-36 animate-pulse rounded bg-gray-100" />
      </div>
      <div className="h-11 w-11 shrink-0 animate-pulse rounded-full bg-gray-100" />
    </div>
  );
}

export default ViewHistory;
