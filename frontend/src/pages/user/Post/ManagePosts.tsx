import {
  faCircleCheck,
  faEye,
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
    if (!window.confirm("Bạn có chắc muốn xóa tin này?")) return;

    try {
      const res = await axiosInstance.delete(`/api/v1/posts/${postId}`);
      toast.success(res.data.message || "Đã xóa tin đăng");
      setPosts((prev) => prev.filter((post) => post.id !== postId));
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Không thể xóa tin");
    }
  };

  const handleMarkSold = async (postId: number) => {
    try {
      const res = await axiosInstance.patch(`/api/v1/posts/${postId}/sold`);
      toast.success(res.data.message || "Đã cập nhật tin đăng");
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId ? { ...post, status: "sold" } : post,
        ),
      );
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Không thể cập nhật tin");
    }
  };

  return (
    <div className="min-h-screen px-[10rem] pt-[9rem] pb-16">
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
            {["all", "pending", "active", "sold", "rejected"].map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`h-14 rounded-xl px-5 text-[1.4rem] transition-colors ${
                  statusFilter === status
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {status === "all" ? "Tất cả" : statusLabels[status]}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => void fetchPosts()}
            className="flex h-14 items-center gap-2 rounded-xl border border-gray-300 px-5 text-gray-600 transition-colors hover:bg-gray-50"
          >
            <FontAwesomeIcon icon={faRotateRight} />
            Tải lại
          </button>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white">
          {isLoading ? (
            <div className="p-8 text-center text-gray-500">
              Đang tải tin đăng...
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="flex min-h-[28rem] flex-col items-center justify-center p-8 text-center">
              <p className="font-medium text-gray-900">Chưa có tin đăng nào</p>
              <button
                type="button"
                onClick={() => navigate("/posts/create")}
                className="mt-5 rounded-xl bg-amber-500 px-6 py-3 text-white transition-colors hover:bg-amber-600"
              >
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
                    className="grid grid-cols-[14rem_1fr_auto] gap-5 p-5"
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
                      <p className="mt-2 text-[1.8rem] font-semibold text-amber-600">
                        {Number(post.price).toLocaleString("vi-VN")} đ
                      </p>
                      <p className="mt-2 text-gray-500">
                        {post.vehicle?.brandName} {post.vehicle?.modelName}
                        {post.vehicle?.manufactureYear
                          ? ` • ${post.vehicle.manufactureYear}`
                          : ""}
                        {post.province ? ` • ${post.province}` : ""}
                      </p>
                      <p className="mt-1 text-[1.3rem] text-gray-400">
                        {new Date(post.createdAt).toLocaleDateString("vi-VN")} •{" "}
                        {post.viewCount} lượt xem
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/posts/${post.slug}`}
                        className="flex h-12 w-12 items-center justify-center rounded-xl border border-gray-300 text-gray-500 transition-colors hover:bg-gray-50"
                        title="Xem tin"
                      >
                        <FontAwesomeIcon icon={faEye} />
                      </Link>
                      <Link
                        to={`/posts/${post.slug}/edit`}
                        className="flex h-12 w-12 items-center justify-center rounded-xl border border-amber-200 text-amber-600 transition-colors hover:bg-amber-50"
                        title="Sửa tin"
                      >
                        <FontAwesomeIcon icon={faPenToSquare} />
                      </Link>
                      {post.status !== "sold" && (
                        <button
                          type="button"
                          onClick={() => void handleMarkSold(post.id)}
                          className="flex h-12 w-12 items-center justify-center rounded-xl border border-gray-300 text-green-600 transition-colors hover:bg-green-50"
                          title="Đánh dấu đã bán"
                        >
                          <FontAwesomeIcon icon={faCircleCheck} />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => void handleDelete(post.id)}
                        className="flex h-12 w-12 items-center justify-center rounded-xl border border-red-200 text-red-500 transition-colors hover:bg-red-50"
                        title="Xóa tin"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ManagePosts;
