import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faBan,
  faClipboardList,
  faLocationDot,
  faShieldHalved,
  faUnlock,
} from "@fortawesome/free-solid-svg-icons";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import axiosInstance from "../../../configs/axiosInstance";
import avatarDefault from "../../../assets/images/avatar_default.png";
import { ReasonType, TargetType, UserStatus } from "../../../shared";
import BanUserModal from "../components/BanUserModal";

interface AdminUserDetailData {
  user: {
    id: number;
    fullName?: string;
    email: string;
    phone?: string;
    avatar?: string;
    status: UserStatus;
    banReason?: string;
    isVerified: boolean;
    two_factor_enabled?: boolean;
    createdAt: string;
    updatedAt?: string;
  };
  postStats: {
    total: number;
    draft: number;
    pending: number;
    active: number;
    sold: number;
    expired: number;
    hidden: number;
    rejected: number;
  };
  posts: Array<{
    id: number;
    title: string;
    slug: string;
    status: string;
    price: number;
    province?: string;
    district?: string;
    ward?: string;
    rejectedReason?: string;
    hiddenReason?: string;
    createdAt: string;
    updatedAt: string;
  }>;
  addresses: Array<{
    id: number;
    province: string;
    district: string;
    ward: string;
    address?: string;
    isDefault: boolean;
  }>;
  violations: Array<{
    id: number;
    reporterName?: string;
    reporterEmail?: string;
    targetId: number;
    targetType: string;
    reasonType: string;
    reasonDetail: string;
    status: string;
    note?: string;
    createdAt: string;
  }>;
}

interface AdminUserDetailResponse {
  data: AdminUserDetailData;
}

const statusLabels: Record<UserStatus, string> = {
  [UserStatus.ACTIVE]: "Đang hoạt động",
  [UserStatus.BANNED]: "Đã khóa",
};

const statusBadgeClasses: Record<UserStatus, string> = {
  [UserStatus.ACTIVE]: "bg-emerald-100 text-emerald-700",
  [UserStatus.BANNED]: "bg-red-100 text-red-700",
};

const postStatusLabels: Record<string, string> = {
  draft: "Bản nháp",
  pending: "Chờ duyệt",
  active: "Đang hiển thị",
  sold: "Đã bán",
  expired: "Hết hạn",
  hidden: "Đã ẩn",
  rejected: "Từ chối",
};

const reportStatusLabels: Record<string, string> = {
  pending: "Đang chờ",
  resolved: "Đã xử lý",
  rejected: "Từ chối",
};

const reportStatusClasses: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  resolved: "bg-emerald-100 text-emerald-700",
  rejected: "bg-gray-100 text-gray-600",
};

const reportReasonLabels: Record<string, string> = {
  [ReasonType.FAKE_INFO]: "Thông tin không trung thực",
  [ReasonType.WRONG_PRICE]: "Giá đăng không đúng",
  [ReasonType.DUPLICATE_POST]: "Tin đăng trùng lặp",
  [ReasonType.ALREADY_SOLD]: "Xe đã bán nhưng vẫn đăng tin",
  [ReasonType.STOLEN_VEHICLE]: "Nghi ngờ xe gian hoặc xe bị đánh cắp",
  [ReasonType.FAKE_IMAGES]: "Hình ảnh không đúng hoặc giả mạo",
  [ReasonType.FRAUD]: "Lừa đảo, chiếm đoạt tài sản",
  [ReasonType.SPAM]: "Spam tin nhắn hoặc tin đăng",
  [ReasonType.ABUSIVE]: "Ngôn từ xúc phạm hoặc không phù hợp",
  [ReasonType.SCAM]: "Giả mạo người bán",
  [ReasonType.OTHER]: "Lý do khác",
};

const reportTargetLabels: Record<string, string> = {
  [TargetType.POST]: "Tin đăng",
  [TargetType.USER]: "Người dùng",
};

function formatDate(value?: string) {
  if (!value) return "Chưa cập nhật";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Chưa cập nhật";
  return date.toLocaleDateString("vi-VN");
}

function formatCurrency(value?: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function AdminUserDetailSkeleton() {
  return (
    <section className="px-5 py-6 md:px-8">
      <div className="mb-5 flex flex-col gap-4 rounded-lg border border-gray-300 bg-white p-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-4">
          <div className="h-5 w-40 animate-pulse rounded bg-gray-200" />
          <div className="h-8 w-64 animate-pulse rounded bg-gray-200" />
          <div className="h-5 w-full max-w-[58rem] animate-pulse rounded bg-gray-100" />
        </div>
        <div className="h-11 w-32 animate-pulse rounded-full bg-gray-200" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[32rem_1fr]">
        <aside className="space-y-5">
          <div className="rounded-lg border border-gray-300 bg-white p-5">
            <div className="flex items-center gap-4 border-b border-b-gray-300 pb-5">
              <div className="h-20 w-20 shrink-0 animate-pulse rounded-full bg-gray-200" />
              <div className="min-w-0 flex-1 space-y-3">
                <div className="h-6 w-4/5 animate-pulse rounded bg-gray-200" />
                <div className="h-4 w-24 animate-pulse rounded bg-gray-100" />
              </div>
            </div>
            <div className="mt-5 space-y-3">
              {Array.from({ length: 5 }).map((_, index) => (
                <div
                  key={index}
                  className="h-5 w-full animate-pulse rounded bg-gray-100"
                />
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-gray-300 bg-white p-5">
            <div className="h-6 w-32 animate-pulse rounded bg-gray-200" />
            <div className="mt-5 space-y-3">
              <div className="h-5 w-2/3 animate-pulse rounded bg-gray-200" />
              <div className="h-5 w-full animate-pulse rounded bg-gray-100" />
              {Array.from({ length: 2 }).map((_, index) => (
                <div
                  key={index}
                  className="rounded-lg border border-gray-200 bg-gray-50 p-3"
                >
                  <div className="h-5 w-1/2 animate-pulse rounded bg-gray-200" />
                  <div className="mt-3 h-4 w-4/5 animate-pulse rounded bg-gray-100" />
                </div>
              ))}
            </div>
          </div>
        </aside>

        <main className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="rounded-lg border border-gray-300 bg-white p-5"
              >
                <div className="h-4 w-24 animate-pulse rounded bg-gray-100" />
                <div className="mt-3 h-8 w-16 animate-pulse rounded bg-gray-200" />
              </div>
            ))}
          </div>

          <div className="rounded-lg border border-gray-300 bg-white">
            <div className="border-b border-gray-200 p-5">
              <div className="h-6 w-48 animate-pulse rounded bg-gray-200" />
            </div>
            <div className="divide-y divide-gray-100">
              {Array.from({ length: 4 }).map((_, index) => (
                <article
                  key={index}
                  className="grid gap-3 p-5 lg:grid-cols-[1fr_14rem_14rem] lg:items-center"
                >
                  <div className="space-y-3">
                    <div className="h-5 w-4/5 animate-pulse rounded bg-gray-200" />
                    <div className="h-4 w-3/5 animate-pulse rounded bg-gray-100" />
                  </div>
                  <div className="h-5 w-28 animate-pulse rounded bg-gray-200" />
                  <div className="space-y-3">
                    <div className="h-8 w-24 animate-pulse rounded-full bg-gray-100" />
                    <div className="h-4 w-20 animate-pulse rounded bg-gray-100" />
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-gray-300 bg-white">
            <div className="border-b border-gray-200 p-5">
              <div className="h-6 w-40 animate-pulse rounded bg-gray-200" />
            </div>
            <div className="divide-y divide-gray-100">
              {Array.from({ length: 3 }).map((_, index) => (
                <article key={index} className="p-5">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="space-y-3">
                      <div className="h-5 w-36 animate-pulse rounded bg-gray-200" />
                      <div className="h-4 w-44 animate-pulse rounded bg-gray-100" />
                    </div>
                    <div className="h-8 w-24 animate-pulse rounded-full bg-gray-100" />
                  </div>
                  <div className="mt-4 h-5 w-full animate-pulse rounded bg-gray-100" />
                  <div className="mt-3 h-4 w-2/3 animate-pulse rounded bg-gray-100" />
                </article>
              ))}
            </div>
          </div>
        </main>
      </div>
    </section>
  );
}

function AdminUserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<AdminUserDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [banReason, setBanReason] = useState("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const fetchDetail = async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      const res = await axiosInstance.get<AdminUserDetailResponse>(
        `/api/v1/users/admin/${id}/detail`,
      );
      setData(res.data.data);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Không thể tải chi tiết người dùng",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const defaultAddress = useMemo(
    () => data?.addresses.find((address) => address.isDefault),
    [data?.addresses],
  );

  useEffect(() => {
    if (id) {
      void fetchDetail();
    }
  }, [id]);

  const handleUpdateStatus = async () => {
    if (!data) return;
    const isBanned = data.user.status === UserStatus.BANNED;
    const reason = banReason.trim();
    if (!isBanned && !reason) {
      toast.error("Vui lòng nhập lý do khóa tài khoản");
      return;
    }
    try {
      setIsUpdatingStatus(true);
      const response = await axiosInstance.patch(
        `/api/v1/users/${data.user.id}/${isBanned ? "unban" : "ban"}`,
        isBanned ? undefined : { reason },
      );
      toast.success(
        response.data.message ||
          (isBanned ? "Đã mở khóa tài khoản" : "Đã khóa tài khoản"),
      );
      setIsStatusModalOpen(false);
      setBanReason("");
      await fetchDetail();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          "Không thể cập nhật trạng thái tài khoản",
      );
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  if (isLoading) {
    return <AdminUserDetailSkeleton />;
  }

  if (!data) {
    return (
      <section className="px-5 py-6 md:px-8">
        <div className="rounded-lg border border-gray-300 bg-white p-8 text-center">
          <p className="font-semibold text-gray-900">
            Không tìm thấy thông tin người dùng
          </p>
          <button
            type="button"
            onClick={() => navigate("/admin/users")}
            className="mt-4 rounded-lg bg-blue-600 px-5 py-3 font-medium text-white transition-colors hover:bg-blue-700"
          >
            Quay lại danh sách
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="px-5 py-6 md:px-8">
      <div className="mb-5 flex flex-col bg-white p-6 rounded-lg border border-gray-300 gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <button
            type="button"
            onClick={() => navigate("/admin/users")}
            className="mb-4 flex items-center gap-2 text-gray-500 transition-colors hover:text-gray-900"
          >
            <FontAwesomeIcon icon={faArrowLeft} />
            Quay lại danh sách
          </button>
          <h1 className="text-[2.2rem] font-medium text-gray-900">
            Chi tiết người dùng
          </h1>
          <p className="mt-1 text-gray-500">
            Theo dõi thông tin tài khoản, khu vực, bài đăng và lịch sử vi phạm.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setBanReason("");
              setIsStatusModalOpen(true);
            }}
            className={`flex px-6 py-3 items-center gap-2 rounded-full text-[1.4rem] font-medium text-white transition-colors ${
              data.user.status === UserStatus.BANNED
                ? "bg-emerald-600 hover:bg-emerald-700"
                : "bg-red-600 hover:bg-red-700"
            }`}
          >
            <FontAwesomeIcon
              icon={data.user.status === UserStatus.BANNED ? faUnlock : faBan}
            />
            {data.user.status === UserStatus.BANNED
              ? "Mở khóa tài khoản"
              : "Khóa tài khoản"}
          </button>
        </div>
      </div>

      {isStatusModalOpen && data.user.status !== UserStatus.BANNED && (
        <BanUserModal
          userName={data.user.fullName || data.user.email}
          reason={banReason}
          isSubmitting={isUpdatingStatus}
          onReasonChange={setBanReason}
          onClose={() => setIsStatusModalOpen(false)}
          onConfirm={() => void handleUpdateStatus()}
        />
      )}

      {isStatusModalOpen && data.user.status === UserStatus.BANNED && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-5"
          onMouseDown={() => !isUpdatingStatus && setIsStatusModalOpen(false)}
        >
          <div
            className="w-full max-w-[48rem] rounded-lg bg-white p-6 shadow-xl"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <h2 className="text-[2rem] font-semibold text-gray-900">
              {data.user.status === UserStatus.BANNED
                ? "Mở khóa tài khoản"
                : "Khóa tài khoản"}
            </h2>
            <p className="mt-2 text-gray-500">
              {data.user.fullName || data.user.email}
            </p>
            {data.user.status !== UserStatus.BANNED ? (
              <>
                <label className="mt-5 block font-medium text-gray-700">
                  Lý do khóa
                </label>
                <textarea
                  value={banReason}
                  onChange={(event) => setBanReason(event.target.value)}
                  rows={5}
                  maxLength={500}
                  placeholder="Nhập lý do khóa tài khoản..."
                  className="mt-2 w-full resize-none rounded-lg border border-gray-300 p-4 outline-none focus:border-red-500"
                />
              </>
            ) : (
              <p className="mt-5 rounded-lg bg-emerald-50 p-4 text-emerald-700">
                Tài khoản sẽ có thể đăng nhập và sử dụng hệ thống trở lại.
              </p>
            )}
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                disabled={isUpdatingStatus}
                onClick={() => setIsStatusModalOpen(false)}
                className="h-16 rounded-lg border border-gray-300 px-5 font-medium text-gray-700"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={isUpdatingStatus}
                onClick={() => void handleUpdateStatus()}
                className={`h-16 rounded-lg px-5 font-medium text-white disabled:opacity-60 ${
                  data.user.status === UserStatus.BANNED
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {isUpdatingStatus
                  ? "Đang cập nhật..."
                  : data.user.status === UserStatus.BANNED
                    ? "Xác nhận mở khóa"
                    : "Xác nhận khóa"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-[32rem_1fr]">
        <aside className="space-y-5">
          <div className="rounded-lg border border-gray-300 bg-white p-5">
            <div className="flex items-center gap-4 border-b border-b-gray-300 pb-5">
              <div className="h-20 w-20 overflow-hidden rounded-full bg-gray-100">
                <img
                  src={data.user.avatar || avatarDefault}
                  alt={data.user.fullName || data.user.email}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="min-w-0">
                <p className="truncate text-[1.8rem] font-semibold">
                  {data.user.fullName || "Chưa cập nhật tên"}
                </p>
                <div className="text-gray-500">ID #{data.user.id} </div>
                <span
                  className={`inline-flex px-3 rounded-full py-1 w-fit text-[1.2rem] ${statusBadgeClasses[data.user.status]}`}
                >
                  {statusLabels[data.user.status]}
                </span>
              </div>
            </div>
            <div className="mt-5 space-y-3 text-[1.6rem]">
              <p className="break-all">
                <span className="font-semibold text-gray-600">Email: </span>
                {data.user.email}
              </p>
              <p>
                <span className="font-semibold text-gray-600">SĐT: </span>
                {data.user.phone || "Chưa cập nhật"}
              </p>
              <p>
                <span className="font-semibold text-gray-600">Xác minh: </span>
                {data.user.isVerified ? "Đã xác minh" : "Chưa xác minh"}
              </p>
              <p>
                <span className="font-semibold text-gray-600">2FA: </span>
                {data.user.two_factor_enabled ? "Đã bật" : "Đã tắt"}
              </p>
              <p>
                <span className="font-semibold text-gray-600">Ngày tạo: </span>
                {formatDate(data.user.createdAt)}
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-gray-300 bg-white p-5">
            <div className="flex items-center gap-3 font-semibold text-gray-900">
              <FontAwesomeIcon icon={faLocationDot} className="text-blue-600" />
              Khu vực
            </div>
            {defaultAddress ? (
              <div className="mt-46text-[1.4rem] text-gray-600">
                <p className="font-semibold text-gray-900">
                  {defaultAddress.province}
                </p>
                <p className="mt-1">
                  {[
                    defaultAddress.address,
                    defaultAddress.ward,
                    defaultAddress.district,
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </p>
              </div>
            ) : (
              <p className="mt-4 text-gray-500">Chưa có địa chỉ mặc định</p>
            )}
            <div className="mt-4 space-y-3">
              {data.addresses.map((address) => (
                <div
                  key={address.id}
                  className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-[1.35rem]"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-gray-900">
                      {address.province}
                    </p>
                    {address.isDefault && (
                      <span className="rounded-full bg-blue-100 px-3 py-1 text-[1.2rem] text-blue-700">
                        Mặc định
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-gray-600">
                    {[address.address, address.ward, address.district]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </aside>

        <main className="space-y-5">
          {data.user.banReason && (
            <div className="rounded-lg border border-red-100 bg-red-50 p-5 text-red-700">
              <div className="flex items-center gap-3 font-semibold">
                <FontAwesomeIcon icon={faBan} />
                Lý do khóa
              </div>
              <p className="mt-2">{data.user.banReason}</p>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-lg border border-gray-300 bg-white p-5">
              <p className=" uppercase text-gray-500">Tổng tin</p>
              <p className="mt-2 text-[2.4rem]">{data.postStats.total}</p>
            </div>
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-5">
              <p className=" uppercase text-amber-700">Chờ duyệt</p>
              <p className="mt-2 text-[2.4rem] text-amber-700">
                {data.postStats.pending}
              </p>
            </div>
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-5">
              <p className=" uppercase text-emerald-700">Đang hiển thị</p>
              <p className="mt-2 text-[2.4rem] text-emerald-700">
                {data.postStats.active}
              </p>
            </div>
            <div className="rounded-lg border border-red-200 bg-red-50 p-5">
              <p className=" uppercase text-red-700">Ẩn/từ chối</p>
              <p className="mt-2 text-[2.4rem] text-red-700">
                {data.postStats.hidden + data.postStats.rejected}
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-gray-300 bg-white">
            <div className="flex items-center gap-3 border-b border-gray-200 p-5 font-semibold text-gray-900">
              <FontAwesomeIcon
                icon={faClipboardList}
                className="text-blue-600"
              />
              Danh sách bài đăng
            </div>
            {data.posts.length === 0 ? (
              <p className="p-5 text-gray-500">Người dùng chưa có bài đăng.</p>
            ) : (
              <div className="divide-y divide-gray-100">
                {data.posts.map((post) => (
                  <article
                    key={post.id}
                    className="grid gap-3 p-5 lg:grid-cols-[1fr_14rem_14rem] lg:items-center"
                  >
                    <div className="min-w-0">
                      <Link
                        to={`/posts/${post.slug}`}
                        className="line-clamp-1 font-semibold text-gray-900 hover:text-blue-600"
                      >
                        {post.title}
                      </Link>
                      <p className="mt-1 text-[1.3rem] text-gray-500">
                        {[post.ward, post.district, post.province]
                          .filter(Boolean)
                          .join(", ") || "Chưa có khu vực"}
                      </p>
                      {(post.rejectedReason || post.hiddenReason) && (
                        <p className="mt-2  text-red-600">
                          Lý do: {post.rejectedReason || post.hiddenReason}
                        </p>
                      )}
                    </div>
                    <p className="font-semibold text-gray-900">
                      {formatCurrency(post.price)}
                    </p>
                    <div>
                      <span className="inline-flex rounded-full bg-gray-100 px-4 py-2  text-gray-700">
                        {postStatusLabels[post.status] || post.status}
                      </span>
                      <p className="mt-2 text-[1.2rem] text-gray-500">
                        {formatDate(post.createdAt)}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-lg border border-gray-300 bg-white">
            <div className="flex items-center gap-3 border-b border-gray-200 p-5 font-semibold text-gray-900">
              <FontAwesomeIcon icon={faShieldHalved} className="text-red-600" />
              Lịch sử vi phạm
            </div>
            {data.violations.length === 0 ? (
              <p className="p-5 text-gray-500">
                Chưa ghi nhận vi phạm hoặc báo cáo.
              </p>
            ) : (
              <div className="space-y-3 p-5">
                {data.violations.map((violation) => (
                  <article
                    key={violation.id}
                    className="rounded-lg border border-gray-200 bg-gray-50 p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <p className="font-semibold text-gray-900">
                        {reportReasonLabels[violation.reasonType] ||
                          violation.reasonType}
                      </p>
                      <span
                        className={`shrink-0 rounded-full px-5 py-2 text-[1.4rem] font-medium ${
                          reportStatusClasses[violation.status] ||
                          "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {reportStatusLabels[violation.status] ||
                          violation.status}
                      </span>
                    </div>
                    <p className="mt-3 leading-6 text-gray-700">
                      {violation.reasonDetail}
                    </p>
                    <div className="mt-4 grid gap-2 border-t border-gray-200 pt-3 text-[1.3rem] text-gray-500 sm:grid-cols-2">
                      <p>
                        <span className="font-medium text-gray-600">
                          Liên quan đến:{" "}
                        </span>
                        {reportTargetLabels[violation.targetType] ||
                          violation.targetType}{" "}
                        #{violation.targetId}
                      </p>
                      <p>
                        <span className="font-medium text-gray-600">
                          Ngày báo cáo:{" "}
                        </span>
                        {formatDate(violation.createdAt)}
                      </p>
                      <p className="sm:col-span-2">
                        <span className="font-medium text-gray-600">
                          Người báo cáo:{" "}
                        </span>
                        {violation.reporterName ||
                          violation.reporterEmail ||
                          "Không rõ"}
                      </p>
                    </div>
                    {violation.note && (
                      <div className="mt-3 rounded-lg bg-white p-3 text-[1.3rem] text-gray-600">
                        <span className="font-medium">Kết quả xử lý: </span>
                        {violation.note}
                      </div>
                    )}
                  </article>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </section>
  );
}

export default AdminUserDetail;
