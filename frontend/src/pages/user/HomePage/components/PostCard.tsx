import {
  faHeart as faHeartSolid,
  faLocationDot,
  faStar,
} from "@fortawesome/free-solid-svg-icons";
import { faHeart as faHeartRegular } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import axiosInstance from "../../../../configs/axiosInstance";
import useAuthModal from "../../../../hooks/useAuthModal";
import { useUser } from "../../../../hooks/useUser";
import type { ListingPost } from "../../Post/post.types";

interface SavedPostItem {
  id: number;
  post: {
    id: number;
  };
}

function PostCard({
  post,
  layout = "grid",
}: {
  post: ListingPost;
  layout?: "grid" | "list";
}) {
  const { user } = useUser();
  const { openAuthModal } = useAuthModal();
  const queryClient = useQueryClient();
  const [isSaved, setIsSaved] = useState(Boolean(post.isSaved));
  const [isSaving, setIsSaving] = useState(false);
  const { data: savedPosts = [] } = useQuery<SavedPostItem[]>({
    queryKey: ["saved-posts", user?.id],
    queryFn: async () => {
      const res = await axiosInstance.get<{ data: SavedPostItem[] }>(
        "/api/v1/saved-post",
      );
      return res.data.data || [];
    },
    enabled: Boolean(user?.id),
    staleTime: 60 * 1000,
  });
  const image =
    post.post_images?.find((postImage) => postImage.isPrimary)?.imageUrl ||
    [...(post.post_images || [])].sort((a, b) => a.sortOrder - b.sortOrder)[0]
      ?.imageUrl;
  const address = [post.district, post.province].filter(Boolean).join(", ");
  const createdAt = new Date(post.createdAt).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const isOwner = post.user?.id === user?.id;

  useEffect(() => {
    if (!user?.id) {
      setIsSaved(false);
      return;
    }

    setIsSaved(savedPosts.some((item) => item.post.id === post.id));
  }, [post.id, savedPosts, user?.id]);

  const handleToggleSaved = async () => {
    if (!user?.id) {
      openAuthModal();
      return;
    }

    if (isOwner) {
      toast.info("Bạn không thể lưu tin của chính mình");
      return;
    }

    const nextSaved = !isSaved;

    try {
      setIsSaving(true);
      setIsSaved(nextSaved);

      const res = nextSaved
        ? await axiosInstance.post("/api/v1/saved-post", { postId: post.id })
        : await axiosInstance.delete(`/api/v1/saved-post/${post.id}`);

      toast.success(
        res.data.message ||
          (nextSaved
            ? "Đã thêm tin vào yêu thích"
            : "Đã bỏ tin khỏi yêu thích"),
      );
      await queryClient.invalidateQueries({
        queryKey: ["saved-posts", user.id],
      });
    } catch (error: any) {
      setIsSaved(!nextSaved);
      toast.error(
        error?.response?.data?.message || "Không thể cập nhật tin yêu thích",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <article
      className={`group overflow-hidden rounded-2xl border border-gray-200 bg-white transition-all duration-300 hover:border-amber-200 hover:shadow-lg ${
        layout === "list"
          ? "grid sm:grid-cols-[24rem_1fr]"
          : "hover:-translate-y-1"
      }`}
    >
      <div
        className={`relative ${
          layout === "list"
            ? "h-64 overflow-hidden bg-gray-100 sm:h-full sm:min-h-[18rem]"
            : "aspect-[4/3] overflow-hidden bg-gray-100"
        }`}
      >
        <Link to={`/posts/${post.slug}`} className="block h-full w-full">
          {image ? (
            <img
              src={image}
              alt={post.title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            />
          ) : (
            <span className="flex h-full items-center justify-center text-gray-400">
              Không có ảnh
            </span>
          )}
        </Link>
        <button
          type="button"
          onClick={() => void handleToggleSaved()}
          disabled={isSaving}
          aria-label={isSaved ? "Bỏ khỏi yêu thích" : "Thêm vào yêu thích"}
          className={`absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-full bg-white/95 text-[1.7rem] shadow-md transition-all hover:scale-105 disabled:cursor-not-allowed disabled:opacity-60 ${
            isSaved ? "text-red-500" : "text-gray-500 hover:text-red-500"
          }`}
        >
          <FontAwesomeIcon icon={isSaved ? faHeartSolid : faHeartRegular} />
        </button>
      </div>
      <Link to={`/posts/${post.slug}`} className="block p-4">
        {post.user?.sellerType === "professional" &&
          post.user.professionalSellerProfile && (
          <div className="mb-2 flex items-center gap-2 text-[1.2rem] font-medium text-amber-700">
            {post.user.professionalSellerProfile.logoUrl && (
              <img
                src={post.user.professionalSellerProfile.logoUrl}
                alt=""
                className="h-7 w-7 rounded-full object-cover"
              />
            )}
            <span className="truncate">
              {post.user.professionalSellerProfile.storeName}
            </span>
            <span className="shrink-0 rounded-full bg-amber-50 px-2 py-1">
              Bán chuyên
            </span>
          </div>
          )}
        <h3
          className={`line-clamp-2 font-semibold leading-snug text-gray-950 group-hover:text-amber-600 ${
            layout === "grid" ? "min-h-[4.8rem]" : ""
          }`}
        >
          {post.title}
        </h3>
        <p className="mt-3 text-[2rem] font-semibold text-amber-600">
          {Number(post.price).toLocaleString("vi-VN")} đ
        </p>
        <div className="mt-3 space-y-2 text-[1.3rem] text-gray-500">
          {address && (
            <p className="flex items-center gap-2">
              <FontAwesomeIcon icon={faLocationDot} />
              <span className="truncate">{address}</span>
            </p>
          )}
          <p className="flex items-center gap-2">
            <FontAwesomeIcon icon={faStar} className="text-amber-400" />
            <span>{post.vehicle?.brandName || "Xe đã qua kiểm duyệt"}</span>
          </p>
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 text-[1.3rem] text-gray-400">
          <span>{createdAt}</span>
          <span>{post.viewCount} lượt xem</span>
        </div>
      </Link>
    </article>
  );
}

export default PostCard;
