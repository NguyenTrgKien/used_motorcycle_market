import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faBan,
  faClipboardList,
  faLocationDot,
  faShieldHalved,
} from "@fortawesome/free-solid-svg-icons";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import axiosInstance from "../../../configs/axiosInstance";
import avatarDefault from "../../../assets/images/avatar_default.png";
import { UserStatus } from "../../../shared";

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

  const defaultAddress = useMemo(
    () => data?.addresses.find((address) => address.isDefault),
    [data?.addresses],
  );

  useEffect(() => {
    const fetchDetail = async () => {
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

    if (id) {
      void fetchDetail();
    }
  }, [id]);

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
        <span
          className={`inline-flex w-fit rounded-full px-5 py-3 text-[1.4rem] ${statusBadgeClasses[data.user.status]}`}
        >
          {statusLabels[data.user.status]}
        </span>
      </div>

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
                <p className="text-gray-500">ID #{data.user.id}</p>
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
              <div className="divide-y divide-gray-100">
                {data.violations.map((violation) => (
                  <article key={violation.id} className="p-5">
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="font-semibold text-gray-900">
                          {violation.reasonType}
                        </p>
                        <p className="mt-1 text-[1.3rem] text-gray-500">
                          Đối tượng: {violation.targetType} #
                          {violation.targetId}
                        </p>
                      </div>
                      <span className="w-fit rounded-full bg-gray-100 px-4 py-2  text-gray-700">
                        {reportStatusLabels[violation.status] ||
                          violation.status}
                      </span>
                    </div>
                    <p className="mt-3 text-gray-700">
                      {violation.reasonDetail}
                    </p>
                    <p className="mt-2  text-gray-500">
                      Người báo cáo:{" "}
                      {violation.reporterName ||
                        violation.reporterEmail ||
                        "Không rõ"}{" "}
                      • {formatDate(violation.createdAt)}
                    </p>
                    {violation.note && (
                      <p className="mt-2  text-gray-500">
                        Ghi chú: {violation.note}
                      </p>
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
