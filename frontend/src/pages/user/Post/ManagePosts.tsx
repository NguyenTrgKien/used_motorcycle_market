import {
  faAdd,
  faCircleCheck,
  faCreditCard,
  faPenToSquare,
  faPlus,
  faRotateRight,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import axiosInstance from "../../../configs/axiosInstance";
import type { ListingPost } from "./post.types";
import ListingPaymentModal from "./components/ListingPaymentModal";

const statusLabels: Record<string, string> = {
  draft: "Bản nháp",
  pending: "Chờ duyệt",
  active: "Đang hiển thị",
  sold: "Đã bán",
  expired: "Hết hạn",
  hidden: "Đã ẩn",
  rejected: "Bị từ chối",
};

const statusClasses: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600",
  pending: "bg-amber-100 text-amber-700",
  active: "bg-green-100 text-green-700",
  sold: "bg-blue-100 text-blue-700",
  expired: "bg-gray-100 text-gray-600",
  hidden: "bg-gray-100 text-gray-600",
  rejected: "bg-red-100 text-red-700",
};

function ManagePosts() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<ListingPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [soldConfirmationPost, setSoldConfirmationPost] =
    useState<ListingPost | null>(null);
  const [isMarkingSold, setIsMarkingSold] = useState(false);
  const [deleteConfirmationPost, setDeleteConfirmationPost] =
    useState<ListingPost | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [paymentPost, setPaymentPost] = useState<ListingPost | null>(null);

  const filteredPosts = useMemo(
    () =>
      statusFilter === "all"
        ? posts
        : posts.filter((post) => post.status === statusFilter),
    [posts, statusFilter],
  );

  const fetchPosts = async () => {
    try {
      setIsLoading(true);
      const res = await axiosInstance.get<{ data: ListingPost[] }>(
        "/api/v1/posts/my",
      );

      setPosts(res.data.data || []);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Không thể tải danh sách tin",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchPosts();
  }, []);

  const handleDelete = async (postId: number) => {
    try {
      setIsDeleting(true);
      const res = await axiosInstance.delete(`/api/v1/posts/${postId}`);
      toast.success(res.data.message || "Đã xóa tin đăng");
      setPosts((prev) => prev.filter((post) => post.id !== postId));
      setDeleteConfirmationPost(null);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Không thể xóa tin");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleMarkSold = async (postId: number) => {
    try {
      setIsMarkingSold(true);
      const res = await axiosInstance.patch(`/api/v1/posts/${postId}/sold`);
      toast.success(res.data.message || "Đã cập nhật tin đăng");
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId ? { ...post, status: "sold" } : post,
        ),
      );
      setSoldConfirmationPost(null);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Không thể cập nhật tin");
    } finally {
      setIsMarkingSold(false);
    }
  };

  const handleRelist = async (postId: number) => {
    try {
      const res = await axiosInstance.patch(`/api/v1/posts/${postId}/relist`);
      toast.success(res.data.message || "Tin đăng đã được gửi duyệt lại");
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId ? { ...post, status: "pending" } : post,
        ),
      );
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Không thể đăng bán lại tin",
      );
    }
  };

  return (
    <div className="min-h-screen px-[20rem] pt-[2rem] pb-16">
      <div className="bg-white p-10 rounded-xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-[2.2rem] font-semibold text-gray-900">
              Quản lý tin đăng
            </h1>
            <p className="mt-1 text-gray-500">
              Theo dõi trạng thái kiểm duyệt và xử lý tin xe của bạn
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/posts/create")}
            className="flex h-16 items-center gap-3 rounded-xl bg-amber-500 px-6 font-medium text-white transition-colors hover:bg-amber-600"
          >
            <FontAwesomeIcon icon={faPlus} />
            Đăng tin
          </button>
        </div>

        <div className="mb-5 flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex gap-2">
            {[
              "all",
              "draft",
              "pending",
              "active",
              "sold",
              "rejected",
              "hidden",
            ].map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`h-16 rounded-xl px-5 text-[1.4rem] transition-colors ${
                  statusFilter === status
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {status === "all" ? "Tất cả" : statusLabels[status]}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => void fetchPosts()}
            className="flex h-16 items-center gap-2 rounded-xl border border-gray-300 px-5 text-gray-600 transition-colors hover:bg-gray-50"
          >
            <FontAwesomeIcon icon={faRotateRight} />
            Tải lại
          </button>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white">
          {isLoading ? (
            <ManagePostsSkeleton />
          ) : filteredPosts.length === 0 ? (
            <div className="flex min-h-[28rem] flex-col items-center justify-center p-8 text-center">
              <p className="font-medium text-gray-900">Chưa có tin đăng nào</p>
              <button
                type="button"
                onClick={() => navigate("/posts/create")}
                className="mt-5 rounded-xl bg-amber-500 px-6 py-3 text-white transition-colors hover:bg-amber-600"
              >
                <FontAwesomeIcon icon={faAdd} className="pr-1" />
                Đăng tin đầu tiên
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredPosts.map((post) => {
                const image =
                  post.post_images?.find((item) => item.isPrimary)?.imageUrl ||
                  post.post_images?.[0]?.imageUrl;

                return (
                  <div
                    key={post.id}
                    role={post.status !== "hidden" ? "link" : undefined}
                    tabIndex={post.status !== "hidden" ? 0 : undefined}
                    onClick={() => {
                      if (post.status !== "hidden") {
                        navigate(`/posts/${post.slug}`);
                      }
                    }}
                    onKeyDown={(event) => {
                      if (
                        post.status !== "hidden" &&
                        (event.key === "Enter" || event.key === " ")
                      ) {
                        event.preventDefault();
                        navigate(`/posts/${post.slug}`);
                      }
                    }}
                    className={`grid grid-cols-[14rem_1fr_auto] gap-5 p-5 ${
                      post.status !== "hidden"
                        ? "cursor-pointer transition-colors hover:bg-gray-50"
                        : ""
                    }`}
                  >
                    <div className="h-[10rem] overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
                      {image ? (
                        <img
                          src={image}
                          alt={post.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-gray-300">
                          Không có ảnh
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-3">
                        <h2 className="truncate text-[1.8rem] font-medium text-gray-900">
                          {post.title}
                        </h2>
                        <span
                          className={`shrink-0 rounded-full px-3 py-1 text-[1.2rem] ${statusClasses[post.status] || statusClasses.draft}`}
                        >
                          {statusLabels[post.status] || post.status}
                        </span>
                      </div>
                      <p className="mt-2 text-[1.8rem] font-medium text-amber-600">
                        {Number(post.price).toLocaleString("vi-VN")} đ
                      </p>
                      <p className="mt-2 text-gray-600">
                        {post.vehicle?.brandName} {post.vehicle?.modelName}
                        {post.vehicle?.manufactureYear
                          ? ` • ${post.vehicle.manufactureYear}`
                          : ""}
                        {post.province ? ` • ${post.province}` : ""}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-[1.3rem] text-gray-600">
                        {post.status !== "draft" && (
                          <>
                            <p>Ngày đăng tin:</p>
                            <p className="text-gray-900">
                              {new Date(post.createdAt).toLocaleDateString(
                                "vi-VN",
                              )}{" "}
                              • {post.viewCount} lượt xem
                            </p>
                          </>
                        )}
                      </div>
                      {post.hiddenReason && (
                        <p className="mt-2 line-clamp-2 text-[1.3rem] text-red-500">
                          Lý do xóa: {post.hiddenReason}
                        </p>
                      )}
                      {post.rejectedReason && (
                        <p className="mt-2 line-clamp-2 text-[1.3rem] text-red-500">
                          Lý do từ chối: {post.rejectedReason}
                        </p>
                      )}
                      {post.paymentOrder?.status === "rejected" &&
                        post.paymentOrder.rejectedReason && (
                          <p className="mt-2 line-clamp-2 text-[1.3rem] text-red-500">
                            Lý do từ chối thanh toán:{" "}
                            {post.paymentOrder.rejectedReason}
                          </p>
                        )}
                    </div>
                    <div
                      className="flex self-end items-center justify-end gap-2"
                      onClick={(event) => event.stopPropagation()}
                      onKeyDown={(event) => event.stopPropagation()}
                    >
                      {post.status !== "hidden" && (
                        <Link
                          to={`/posts/${post.slug}/edit`}
                          className="flex h-16 items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-amber-500 px-4 text-amber-600 transition-colors hover:bg-amber-50"
                          title="Sửa tin"
                        >
                          <FontAwesomeIcon icon={faPenToSquare} />
                          <span>Sửa tin</span>
                        </Link>
                      )}
                      {post.status === "draft" &&
                        post.listingBillingType === "paid" &&
                        (post.paymentOrder?.status === "pending" &&
                        post.paymentOrder.transferSubmittedAt ? (
                          <button
                            type="button"
                            disabled
                            className="flex h-16 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-gray-200 px-4 text-gray-600"
                          >
                            <FontAwesomeIcon icon={faCreditCard} />
                            <span>Chờ xác nhận thanh toán</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setPaymentPost(post)}
                            className="flex h-16 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-amber-500 px-4 text-white transition-colors hover:bg-amber-600"
                          >
                            <FontAwesomeIcon icon={faCreditCard} />
                            <span>
                              {post.paymentOrder?.status === "rejected"
                                ? "Gửi lại biên lai"
                                : "Thanh toán"}
                            </span>
                          </button>
                        ))}
                      {post.status === "active" && (
                        <button
                          type="button"
                          onClick={() => setSoldConfirmationPost(post)}
                          className="flex h-16 items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-green-600 px-4 text-green-600 transition-colors hover:bg-green-50"
                          title="Đánh dấu đã bán"
                        >
                          <FontAwesomeIcon icon={faCircleCheck} />
                          <span>Đã bán</span>
                        </button>
                      )}
                      {post.status === "sold" && (
                        <button
                          type="button"
                          onClick={() => void handleRelist(post.id)}
                          className="flex h-16 items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-blue-600 px-4 text-blue-600 transition-colors hover:bg-blue-50"
                          title="Đăng bán lại"
                        >
                          <FontAwesomeIcon icon={faRotateRight} />
                          <span>Đăng bán lại</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmationPost(post)}
                        className="flex h-16 items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-red-600 px-4 text-red-600 transition-colors hover:bg-red-50"
                        title="Xóa tin"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                        <span>Xóa tin</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      {soldConfirmationPost && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6"
          role="presentation"
          onClick={() => {
            if (!isMarkingSold) setSoldConfirmationPost(null);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="sold-confirmation-title"
            className="w-full max-w-[48rem] rounded-2xl bg-white p-8 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <h2
              id="sold-confirmation-title"
              className="text-[2rem] font-semibold text-gray-900"
            >
              Xác nhận xe đã bán
            </h2>
            <p className="mt-3 text-[1.5rem] leading-7 text-gray-600">
              Bạn có chắc muốn đánh dấu tin “{soldConfirmationPost.title}” là đã
              bán? Tin sẽ ngừng hiển thị công khai.
            </p>
            <div className="mt-8 flex justify-end gap-3">
              <button
                type="button"
                disabled={isMarkingSold}
                onClick={() => setSoldConfirmationPost(null)}
                className="h-16 rounded-xl border border-gray-300 px-6 text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={isMarkingSold}
                onClick={() => void handleMarkSold(soldConfirmationPost.id)}
                className="flex h-16 items-center gap-2 rounded-xl bg-green-600 px-6 font-medium text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isMarkingSold ? "Đang xử lý..." : "Xác nhận"}
              </button>
            </div>
          </div>
        </div>
      )}
      {paymentPost && (
        <ListingPaymentModal
          postId={paymentPost.id}
          amount={Number(paymentPost.listingFee || 30000)}
          onClose={() => setPaymentPost(null)}
          onPaymentSubmitted={() => void fetchPosts()}
          initialMethod={
            paymentPost.paymentOrder?.status === "rejected"
              ? "bank_transfer"
              : undefined
          }
        />
      )}
      {deleteConfirmationPost && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6"
          role="presentation"
          onClick={() => {
            if (!isDeleting) setDeleteConfirmationPost(null);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-confirmation-title"
            className="w-full max-w-[48rem] rounded-2xl bg-white p-8 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <h2
              id="delete-confirmation-title"
              className="text-[2rem] font-semibold text-gray-900"
            >
              Xác nhận xóa tin
            </h2>
            <p className="mt-3 text-[1.5rem] leading-7 text-gray-600">
              Bạn có chắc muốn xóa tin “{deleteConfirmationPost.title}”? Thao
              tác này không thể hoàn tác.
            </p>
            <div className="mt-8 flex justify-end gap-3">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteConfirmationPost(null)}
                className="h-16 rounded-xl border border-gray-300 px-6 text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => void handleDelete(deleteConfirmationPost.id)}
                className="h-16 rounded-xl bg-red-600 px-6 font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isDeleting ? "Đang xử lý..." : "Xác nhận xóa"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ManagePostsSkeleton() {
  return (
    <div className="divide-y divide-gray-100" aria-hidden="true">
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className="grid animate-pulse grid-cols-[14rem_1fr_auto] gap-5 p-5"
        >
          <div className="h-[10rem] rounded-xl bg-gray-200" />
          <div className="min-w-0 space-y-3 py-1">
            <div className="h-6 w-2/3 rounded bg-gray-200" />
            <div className="h-6 w-1/3 rounded bg-gray-200" />
            <div className="h-4 w-1/2 rounded bg-gray-100" />
            <div className="h-4 w-1/4 rounded bg-gray-100" />
          </div>
          <div className="flex self-end items-center gap-2">
            {Array.from({ length: 3 }).map((_, actionIndex) => (
              <div
                key={actionIndex}
                className="h-16 w-28 rounded-xl bg-gray-200"
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default ManagePosts;
