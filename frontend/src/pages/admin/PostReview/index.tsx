import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faBan,
  faCalendarDays,
  faCheck,
  faClose,
  faFileLines,
  faLocationDot,
  faShieldHalved,
  faUser,
} from "@fortawesome/free-solid-svg-icons";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import FullscreenLoader from "../../../components/FullscreenLoader";
import axiosInstance from "../../../configs/axiosInstance";
import type { ListingPost } from "../../user/Post/post.types";
import PaymentInformationCard from "./PaymentInformationCard";

interface AdminReviewPost extends ListingPost {
  rejectedReason?: string;
  user?: ListingPost["user"] & {
    email?: string;
    status?: string;
    createdAt?: string;
  };
}

const defaultRejectReasons = [
  "Hình ảnh xe chưa rõ ràng hoặc không đủ góc chụp cần thiết.",
  "Thông tin giấy tờ xe chưa đầy đủ hoặc chưa khớp với nội dung tin đăng.",
  "Mô tả tin đăng còn thiếu thông tin quan trọng về tình trạng xe.",
  "Giá bán hoặc thông tin xe có dấu hiệu không phù hợp, cần người bán kiểm tra lại.",
  "Tin đăng có nội dung trùng lặp hoặc chưa đúng quy định đăng tin.",
];

const userStatusLabels: Record<string, string> = {
  active: "Đang hoạt động",
  banned: "Đã bị khóa",
};

interface PostReviewProps {
  readOnly?: boolean;
}

const postStatusLabels: Record<string, string> = {
  draft: "Bản nháp",
  pending: "Chờ kiểm duyệt",
  active: "Đang hiển thị",
  rejected: "Bị từ chối",
  hidden: "Đã ẩn",
  sold: "Đã bán",
};

function PostReview({ readOnly = false }: PostReviewProps) {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState<AdminReviewPost | null>(null);
  const [selectedImage, setSelectedImage] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const images = useMemo(
    () =>
      [...(post?.post_images || [])].sort((a, b) => a.sortOrder - b.sortOrder),
    [post],
  );

  const documentImages = post?.vehicle?.documentImages || [];
  const address = [
    post?.addressDetail,
    post?.ward,
    post?.district,
    post?.province,
  ]
    .filter(Boolean)
    .join(", ");

  const fetchReviewPost = async () => {
    if (!slug) return;

    try {
      setIsLoading(true);
      const res = await axiosInstance.get<{ data: AdminReviewPost }>(
        `/api/v1/posts/admin/review/${slug}`,
      );
      const postData = res.data.data;
      const primaryImage =
        postData.post_images?.find((image) => image.isPrimary)?.imageUrl ||
        [...(postData.post_images || [])].sort(
          (a, b) => a.sortOrder - b.sortOrder,
        )[0]?.imageUrl ||
        "";

      setPost(postData);
      setSelectedImage(primaryImage);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          "Không thể tải chi tiết tin chờ kiểm duyệt",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchReviewPost();
  }, [slug]);

  const handleApprove = async () => {
    if (!post) return;

    try {
      setIsSubmitting(true);
      const res = await axiosInstance.patch(
        `/api/v1/posts/admin/${post.id}/approve`,
      );
      toast.success(res.data.message || "Đã duyệt tin đăng");
      setIsApproveModalOpen(false);
      navigate("/admin/posts/pending");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Không thể duyệt tin");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!post) return;
    const reason = rejectReason.trim();
    if (!reason) {
      toast.error("Vui lòng nhập lý do từ chối");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await axiosInstance.patch(
        `/api/v1/posts/admin/${post.id}/reject`,
        {
          reason,
        },
      );
      toast.success(res.data.message || "Đã từ chối tin đăng");
      setIsRejectModalOpen(false);
      navigate("/admin/posts/pending");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Không thể từ chối tin");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <FullscreenLoader />;
  }

  if (!post) {
    return (
      <section className="px-5 py-10 text-center md:px-8">
        <p className="text-gray-500">Không tìm thấy tin chờ kiểm duyệt</p>
        <button
          type="button"
          onClick={() => navigate("/admin/posts/pending")}
          className="mt-4 h-12 rounded-lg border border-gray-200 bg-white px-5 text-gray-700"
        >
          Quay lại danh sách
        </button>
      </section>
    );
  }

  return (
    <>
      <section className="px-5 py-6 md:px-8">
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <button
            type="button"
            onClick={() =>
              navigate(readOnly ? "/admin/transactions" : "/admin/posts/pending")
            }
            className="flex h-12 w-fit items-center gap-3 rounded-lg border border-gray-200 bg-white px-5 font-medium text-gray-600 transition-colors hover:bg-gray-50"
          >
            <FontAwesomeIcon icon={faArrowLeft} />
            Quay lại danh sách
          </button>
          <span className="w-fit rounded-full bg-amber-100 px-8 py-2 text-amber-700">
            {postStatusLabels[post.status] || post.status}
          </span>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_38rem]">
          <div className="space-y-6">
            <section className="rounded-lg border border-gray-200 bg-white p-5">
              <div className="aspect-[16/9] overflow-hidden rounded-lg bg-gray-100">
                {selectedImage ? (
                  <img
                    src={selectedImage}
                    alt={post.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-gray-400">
                    Không có ảnh
                  </div>
                )}
              </div>
              {images.length > 1 && (
                <div className="mt-4 grid grid-cols-4 gap-3 md:grid-cols-6">
                  {images.map((image) => (
                    <button
                      key={image.id}
                      type="button"
                      onClick={() => setSelectedImage(image.imageUrl)}
                      className={`aspect-square overflow-hidden rounded-lg border ${
                        selectedImage === image.imageUrl
                          ? "border-amber-500"
                          : "border-gray-200"
                      }`}
                    >
                      <img
                        src={image.imageUrl}
                        alt={post.title}
                        className="h-full w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-lg border border-gray-200 bg-white p-6">
              <div className="flex flex-wrap items-center gap-3 text-[1.3rem] text-gray-500">
                {post.category?.name && <span>{post.category.name}</span>}
                <span>
                  <FontAwesomeIcon icon={faCalendarDays} className="mr-2" />
                  {new Date(post.createdAt).toLocaleDateString("vi-VN")}
                </span>
              </div>
              <h2 className="mt-4 text-[2.2rem] font-semibold leading-tight">
                {post.title}
              </h2>
              <p className="mt-3 text-[2.4rem] font-semibold text-red-500">
                {Number(post.price).toLocaleString("vi-VN")} đ
              </p>
              {address && (
                <p className="mt-4 flex gap-3 text-gray-500">
                  <FontAwesomeIcon icon={faLocationDot} className="mt-1" />
                  {address}
                </p>
              )}
              <div className="mt-6 border-t border-gray-100 pt-5">
                <h3 className="font-semibold">Mô tả tin đăng</h3>
                <p className="mt-3 whitespace-pre-line leading-relaxed text-gray-700">
                  {post.description || "Người bán chưa thêm mô tả chi tiết."}
                </p>
              </div>
            </section>

            <section className="rounded-lg border border-gray-200 bg-white p-6">
              <h2 className="text-[2rem] font-bold">Thông số xe</h2>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <Spec label="Loại xe" value={post.vehicle?.bodyType} />
                <Spec label="Hãng xe" value={post.vehicle?.brandName} />
                <Spec label="Dòng xe" value={post.vehicle?.modelName} />
                <Spec
                  label="Năm sản xuất"
                  value={post.vehicle?.manufactureYear}
                />
                <Spec
                  label="Số km"
                  value={
                    post.vehicle?.mileage
                      ? `${post.vehicle.mileage.toLocaleString("vi-VN")} km`
                      : undefined
                  }
                />
                <Spec label="Màu xe" value={post.vehicle?.color} />
                <Spec label="Tình trạng" value={post.vehicle?.condition} />
                <Spec label="Nhiên liệu" value={post.vehicle?.fuelType} />
                <Spec label="Hộp số" value={post.vehicle?.transmission} />
                <Spec label="Giấy tờ" value={post.vehicle?.documentsStatus} />
              </div>
            </section>

            <PaymentInformationCard post={post} />

            {post.status === "pending" && (
              <section className="rounded-lg border border-gray-200 bg-white p-6">
              <h2 className="text-[2rem] font-bold">Ảnh giấy tờ xe</h2>
              {documentImages.length ? (
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  {documentImages.map((image) => (
                    <a
                      key={image.publicId || image.url}
                      href={image.url}
                      target="_blank"
                      rel="noreferrer"
                      className="block overflow-hidden rounded-lg border border-gray-200 bg-gray-50"
                    >
                      <img
                        src={image.url}
                        alt="Giấy tờ xe"
                        className="h-[22rem] w-full object-cover"
                      />
                    </a>
                  ))}
                </div>
              ) : (
                <div className="mt-5 flex items-center gap-3 rounded-lg bg-gray-50 p-5 text-gray-500">
                  <FontAwesomeIcon icon={faFileLines} />
                  Người bán chưa tải ảnh giấy tờ xe.
                </div>
              )}
              </section>
            )}
          </div>

          <aside className="space-y-6">
            <section className="rounded-lg border border-gray-200 bg-white p-6">
              <h2 className="text-[2rem] font-bold">Người đăng tin</h2>
              <div className="mt-5 flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
                  <FontAwesomeIcon icon={faUser} />
                </div>
                <div className="min-w-0">
                  <p className="truncate font-semibold">
                    {post.user?.fullName || "Người bán"}
                  </p>
                  <p className="truncate text-[1.3rem] text-gray-500">
                    {post.user?.email || "Chưa có email"}
                  </p>
                </div>
              </div>
              <div className="mt-5 space-y-3 text-[1.4rem] text-gray-600">
                <Info label="Số điện thoại" value={post.user?.phone} />
                <Info
                  label="Xác minh"
                  value={
                    post.user?.isVerified ? "Đã xác minh" : "Chưa xác minh"
                  }
                />
                <Info
                  label="Trạng thái"
                  value={
                    post.user?.status
                      ? userStatusLabels[post.user.status] || post.user.status
                      : undefined
                  }
                />
              </div>
            </section>

            <section className="rounded-lg border border-gray-200 bg-white p-6">
              <h2 className="text-[2rem] font-bold">Quyết định kiểm duyệt</h2>
              <div className="mt-5 rounded-lg bg-emerald-50 p-4 text-[1.4rem] text-emerald-700">
                <FontAwesomeIcon icon={faShieldHalved} className="mr-2" />
                Chỉ duyệt khi hình ảnh, giấy tờ và mô tả phù hợp với tin đăng.
              </div>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setIsApproveModalOpen(true)}
                className="mt-5 flex h-18 w-full items-center justify-center gap-3 rounded-lg bg-emerald-600 font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <FontAwesomeIcon icon={faCheck} />
                Duyệt tin
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setIsRejectModalOpen(true)}
                className="mt-3 flex h-18 w-full items-center justify-center gap-3 rounded-lg border border-red-200 font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <FontAwesomeIcon icon={faBan} />
                Từ chối tin
              </button>
            </section>
          </aside>
        </div>
      </section>

      {post.status === "pending" && isApproveModalOpen && (
        <div className="fixed inset-0 z-999 flex items-center justify-center bg-black/40 px-5">
          <div className="w-full max-w-[48rem] rounded-lg bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-[2rem] font-semibold text-gray-900">
                  Duyệt tin đăng
                </h2>
                <p className="mt-1 text-[1.4rem] text-gray-500">
                  Tin đăng sẽ được hiển thị công khai sau khi được duyệt.
                </p>
              </div>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setIsApproveModalOpen(false)}
                className="rounded-lg px-3 py-2 text-gray-500 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <FontAwesomeIcon icon={faClose} />
              </button>
            </div>

            <div className="mt-5 rounded-lg border border-emerald-100 bg-emerald-50 p-5 text-[1.4rem] text-emerald-700">
              <FontAwesomeIcon icon={faShieldHalved} className="mr-2" />
              Xác nhận rằng hình ảnh, giấy tờ và mô tả của tin đăng phù hợp với
              quy định.
            </div>

            <div className="mt-5 rounded-lg border border-gray-200 p-4">
              <p className="line-clamp-2 font-semibold text-gray-900">
                {post.title}
              </p>
              <p className="mt-2 text-[1.5rem] font-semibold text-red-500">
                {Number(post.price).toLocaleString("vi-VN")} đ
              </p>
            </div>

            <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setIsApproveModalOpen(false)}
                className="h-16 rounded-lg border border-gray-300 px-5 text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => void handleApprove()}
                className="flex h-16 items-center justify-center gap-3 rounded-lg bg-emerald-600 px-5 text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <FontAwesomeIcon icon={faCheck} />
                Xác nhận duyệt
              </button>
            </div>
          </div>
        </div>
      )}

      {post.status === "pending" && isRejectModalOpen && (
        <div className="fixed inset-0 z-999 flex items-center justify-center bg-black/40 px-5">
          <div className="w-full max-w-[56rem] rounded-lg bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-[2rem] font-semibold text-gray-900">
                  Từ chối tin đăng
                </h2>
                <p className="mt-1 text-[1.4rem] text-gray-500">
                  Nhập lý do để người bán biết cần chỉnh sửa nội dung nào.
                </p>
              </div>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setIsRejectModalOpen(false)}
                className="rounded-lg px-3 py-2 text-gray-500 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <FontAwesomeIcon icon={faClose} />
              </button>
            </div>

            <div className="mt-5 border border-gray-300 shadow-sm rounded-2xl p-5">
              <div className="mt-3 flex flex-wrap gap-2">
                {defaultRejectReasons.map((reason) => (
                  <button
                    key={reason}
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => setRejectReason(reason)}
                    className={`rounded-full border px-6 py-4 text-start text-[1.4rem] transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                      rejectReason === reason
                        ? "border-red-300 bg-red-50 text-red-600"
                        : "border-gray-400 bg-white text-gray-600 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                    }`}
                  >
                    {reason}
                  </button>
                ))}
              </div>
            </div>

            <label
              className="mt-5 block font-medium text-gray-700"
              htmlFor="rejectReason"
            >
              Lý do từ chối
            </label>
            <textarea
              id="rejectReason"
              value={rejectReason}
              disabled={isSubmitting}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={5}
              placeholder="Ví dụ: Hình ảnh không rõ biển số, thông tin giấy tờ chưa khớp..."
              className="mt-3 w-full resize-none rounded-lg border border-gray-200 bg-gray-50 p-4 outline-none transition-colors focus:border-amber-400 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
            />

            <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setIsRejectModalOpen(false)}
                className="h-16 rounded-lg border border-gray-300 px-5 text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => void handleReject()}
                className="flex h-16 items-center justify-center gap-3 rounded-lg bg-red-600 px-5 text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <FontAwesomeIcon icon={faBan} />
                Xác nhận từ chối
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Spec({ label, value }: { label: string; value?: string | number }) {
  return (
    <div className="rounded-lg bg-gray-50 p-4">
      <p className="text-[1.3rem] text-gray-500">{label}</p>
      <p className="mt-1 font-medium text-gray-900">
        {value || "Chưa cập nhật"}
      </p>
    </div>
  );
}

function Info({ label, value }: { label: string; value?: string | number }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-gray-100 pb-3">
      <span className="text-gray-500">{label}</span>
      <span className="text-right font-medium">{value || "Chưa cập nhật"}</span>
    </div>
  );
}

export default PostReview;
