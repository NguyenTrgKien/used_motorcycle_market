import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBan,
  faCircleCheck,
  faClock,
  faEye,
  faRotateLeft,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { Link } from "react-router-dom";
import { statusClasses, statusLabels } from "../constants";
import type { AdminManagedPost } from "../types";
import AdminPostsSkeleton from "./AdminPostsSkeleton";

interface AdminPostsTableProps {
  isLoading: boolean;
  page: number;
  posts: AdminManagedPost[];
  totalPages: number;
  onDeletePost: (post: AdminManagedPost) => void;
  onNextPage: () => void;
  onPrevPage: () => void;
  onRestorePost: (post: AdminManagedPost) => void;
  onViewReason: (post: AdminManagedPost) => void;
}

function AdminPostsTable({
  isLoading,
  page,
  posts,
  totalPages,
  onDeletePost,
  onNextPage,
  onPrevPage,
  onRestorePost,
  onViewReason,
}: AdminPostsTableProps) {
  return (
    <>
      <div className="mt-5 overflow-hidden rounded-lg border border-gray-300">
        <div className="hidden grid-cols-[10rem_1.2fr_1fr_0.8fr_0.8fr_14rem] bg-gray-100 px-5 py-4 text-[1.3rem] font-semibold uppercase text-gray-500 xl:grid">
          <span>Ảnh</span>
          <span>Tin đăng</span>
          <span>Người bán</span>
          <span>Giá</span>
          <span>Trạng thái</span>
          <span>Thao tác</span>
        </div>

        {isLoading ? (
          <AdminPostsSkeleton />
        ) : posts.length === 0 ? (
          <div className="flex min-h-[28rem] flex-col items-center justify-center p-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
              <FontAwesomeIcon icon={faClock} />
            </div>
            <p className="mt-4 font-semibold text-gray-900">
              Không có tin đăng phù hợp
            </p>
            <p className="mt-1 text-gray-500">
              Thử đổi trạng thái hoặc từ khóa tìm kiếm.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {posts.map((post) => (
              <AdminPostRow
                key={post.id}
                post={post}
                onDeletePost={onDeletePost}
                onRestorePost={onRestorePost}
                onViewReason={onViewReason}
              />
            ))}
          </div>
        )}
      </div>

      <div className="mt-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <p className="text-[1.3rem] text-gray-500">
          Trang {page} / {totalPages}
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            disabled={page <= 1}
            onClick={onPrevPage}
            className="h-12 rounded-lg border border-gray-300 px-5 font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Trước
          </button>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={onNextPage}
            className="h-12 rounded-lg border border-gray-300 px-5 font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Sau
          </button>
        </div>
      </div>
    </>
  );
}

function AdminPostRow({
  post,
  onDeletePost,
  onRestorePost,
  onViewReason,
}: {
  post: AdminManagedPost;
  onDeletePost: (post: AdminManagedPost) => void;
  onRestorePost: (post: AdminManagedPost) => void;
  onViewReason: (post: AdminManagedPost) => void;
}) {
  const image =
    post.post_images?.find((item) => item.isPrimary)?.imageUrl ||
    post.post_images?.[0]?.imageUrl;
  const isPending = post.status === "pending";
  const isRejected = post.status === "rejected";
  const isHidden = post.status === "hidden";
  const reasonText = isRejected
    ? post.rejectedReason
    : isHidden
      ? post.hiddenReason
      : undefined;

  return (
    <article className="grid gap-4 p-5 xl:grid-cols-[10rem_1.2fr_1fr_0.8fr_0.8fr_14rem] xl:items-center">
      <div className="h-[8rem] overflow-hidden rounded-lg border border-gray-300 bg-gray-50">
        {image ? (
          <img src={image} alt={post.title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-[1.2rem] text-gray-400">
            Không có ảnh
          </div>
        )}
      </div>

      <div className="min-w-0">
        <h2 className="truncate text-[1.8rem]">{post.title}</h2>
        <p className="mt-2 line-clamp-2 text-[1.3rem] text-gray-500">
          {post.vehicle?.brandName} {post.vehicle?.modelName}
          {post.vehicle?.manufactureYear
            ? ` • ${post.vehicle.manufactureYear}`
            : ""}
          {post.province ? ` • ${post.province}` : ""}
        </p>
        {Boolean(post.reportCount) && (
          <span className="mt-2 inline-flex rounded-full bg-red-50 px-3 py-1 text-[1.2rem] font-medium text-red-600">
            {post.reportCount} report
          </span>
        )}
        {reasonText && (
          <div className="mt-2 text-[1.3rem] text-red-500">
            <p className="line-clamp-2">Lý do: {reasonText}</p>
            <button
              type="button"
              onClick={() => onViewReason(post)}
              className="mt-1 font-medium text-gray-500 underline underline-offset-2 hover:text-gray-700"
            >
              Xem đầy đủ
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 text-gray-600">
        <div className="min-w-0">
          <p className="truncate font-medium">{post.user?.fullName || "Người bán"}</p>
          <p className="truncate text-[1.4rem] text-gray-400">
            {post.user?.phone || "Chưa công khai SĐT"}
          </p>
        </div>
      </div>

      <div className="font-medium text-red-500">
        {Number(post.price).toLocaleString("vi-VN")} đ
      </div>

      <div>
        <span
          className={`inline-flex items-center gap-2 rounded-full px-5 py-2 text-[1.4rem] ${
            statusClasses[post.status] || statusClasses.draft
          }`}
        >
          <FontAwesomeIcon
            icon={
              post.status === "active"
                ? faCircleCheck
                : post.status === "rejected" || post.status === "hidden"
                  ? faBan
                  : faClock
            }
          />
          {statusLabels[post.status] || post.status}
        </span>
      </div>

      <div className="flex items-center gap-2">
        {isPending ? (
          <Link
            to={`/admin/posts/pending/${post.slug}`}
            className="flex h-18 flex-1 items-center justify-center gap-2 rounded-lg border border-gray-300 font-medium text-gray-600 transition-colors hover:bg-gray-50"
          >
            <FontAwesomeIcon icon={faEye} />
            Duyệt
          </Link>
        ) : isHidden ? (
          <button
            type="button"
            onClick={() => onRestorePost(post)}
            className="flex h-18 flex-1 items-center justify-center gap-2 rounded-lg border border-emerald-200 font-medium text-emerald-600 transition-colors hover:bg-emerald-50"
          >
            <FontAwesomeIcon icon={faRotateLeft} />
            Khôi phục
          </button>
        ) : isRejected ? (
          <span className="flex h-18 flex-1 items-center justify-center rounded-lg border border-gray-200 text-gray-400">
            Đã xử lý
          </span>
        ) : (
          <Link
            to={`/posts/${post.slug}`}
            target="_blank"
            className="flex h-18 flex-1 items-center justify-center gap-2 rounded-lg border border-gray-300 font-medium text-gray-600 transition-colors hover:bg-gray-50"
          >
            <FontAwesomeIcon icon={faEye} />
            Xem
          </Link>
        )}
        {!isHidden && (
          <button
            type="button"
            onClick={() => onDeletePost(post)}
            className="flex h-18 w-18 items-center justify-center rounded-lg border border-red-200 text-red-500 transition-colors hover:bg-red-50"
            aria-label="Xóa tin"
          >
            <FontAwesomeIcon icon={faTrash} />
          </button>
        )}
      </div>
    </article>
  );
}

export default AdminPostsTable;
