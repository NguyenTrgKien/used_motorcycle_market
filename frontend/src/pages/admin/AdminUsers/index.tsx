import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBan,
  faClose,
  faEye,
  faLockOpen,
  faMagnifyingGlass,
  faRotateRight,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";
import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { toast } from "react-toastify";
import axiosInstance from "../../../configs/axiosInstance";
import { UserRole, UserStatus } from "../../../shared";
import avatarDefault from "../../../assets/images/avatar_default.png";
import { useNavigate } from "react-router-dom";
import BanUserModal from "../components/BanUserModal";

interface ManagedUser {
  id: number;
  fullName?: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: UserRole;
  status: UserStatus;
  banReason?: string;
  isVerified: boolean;
  createdAt: string;
}

interface ManagedUsersResponse {
  data: {
    items: ManagedUser[];
    total: number;
    page: number;
    limit: number;
    counts: {
      active: number;
      banned: number;
    };
  };
}

interface ManagedUserDetailResponse {
  data: {
    user: ManagedUser & {
      gender?: string;
      birthday?: string;
      personalInfo?: string;
      showEmail?: boolean;
      showPhone?: boolean;
      two_factor_enabled?: boolean;
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
  };
}

const statusLabels: Record<UserStatus, string> = {
  [UserStatus.ACTIVE]: "Đang hoạt động",
  [UserStatus.BANNED]: "Đã khóa",
};

const statusBadgeClasses: Record<UserStatus, string> = {
  [UserStatus.ACTIVE]: "bg-emerald-100 text-emerald-700",
  [UserStatus.BANNED]: "bg-red-100 text-red-700",
};

const formatDate = (value?: string) => {
  if (!value) return "Chưa cập nhật";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Chưa cập nhật";
  return date.toLocaleDateString("vi-VN");
};

function AdminUsersSkeleton() {
  return (
    <div className="divide-y divide-gray-100">
      {Array.from({ length: 5 }).map((_, index) => (
        <article
          key={index}
          className="grid gap-4 p-5 xl:grid-cols-[1.2fr_1fr_0.8fr_0.8fr_16rem] xl:items-center"
        >
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 animate-pulse rounded-full bg-gray-200" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-5 w-2/3 animate-pulse rounded bg-gray-200" />
              <div className="h-4 w-4/5 animate-pulse rounded bg-gray-100" />
            </div>
          </div>
          <div className="h-5 w-32 animate-pulse rounded bg-gray-200" />
          <div className="h-7 w-28 animate-pulse rounded-full bg-gray-200" />
          <div className="h-5 w-24 animate-pulse rounded bg-gray-200" />
          <div className="h-12 w-full animate-pulse rounded-lg bg-gray-100" />
        </article>
      ))}
    </div>
  );
}

function AdminUsers() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [keyword, setKeyword] = useState("");
  const [appliedKeyword, setAppliedKeyword] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [counts, setCounts] = useState({ active: 0, banned: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [banningUser, setBanningUser] = useState<ManagedUser | null>(null);
  const [banReason, setBanReason] = useState("");
  const [selectedUserDetail, setSelectedUserDetail] = useState<
    ManagedUserDetailResponse["data"] | null
  >(null);
  const [isDetailLoading] = useState(false);
  const limit = 10;

  const totalPages = useMemo(
    () => Math.max(Math.ceil(total / limit), 1),
    [total],
  );

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const res = await axiosInstance.get<ManagedUsersResponse>(
        "/api/v1/users/admin/customers",
        {
          params: {
            page,
            limit,
            keyword: appliedKeyword || undefined,
            status: status === "all" ? undefined : status,
          },
        },
      );

      setUsers(
        (res.data.data.items || []).filter(
          (user) => user.role === UserRole.USER,
        ),
      );
      setTotal(res.data.data.total || 0);
      setCounts(res.data.data.counts || { active: 0, banned: 0 });
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Không thể tải danh sách người dùng",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchUsers();
  }, [page, status, appliedKeyword]);

  const handleSearch = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPage(1);
    setAppliedKeyword(keyword.trim());
  };

  const updateUserStatus = async (user: ManagedUser, reason?: string) => {
    const nextAction = user.status === UserStatus.BANNED ? "unban" : "ban";

    try {
      setUpdatingId(user.id);
      const res = await axiosInstance.patch(
        `/api/v1/users/${user.id}/${nextAction}`,
        nextAction === "ban" ? { reason } : undefined,
      );
      toast.success(
        res.data.message ||
          (nextAction === "ban"
            ? "Đã khóa người dùng"
            : "Đã mở khóa người dùng"),
      );
      await fetchUsers();
      setBanningUser(null);
      setBanReason("");
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          "Không thể cập nhật trạng thái người dùng",
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const handleOpenBanModal = (user: ManagedUser) => {
    setBanningUser(user);
    setBanReason("");
  };

  const handleOpenDetailPage = (user: ManagedUser) => {
    navigate(`/admin/users/${user.id}`);
  };

  const handleConfirmBan = async () => {
    if (!banningUser) return;
    const reason = banReason.trim();

    if (!reason) {
      toast.error("Vui lòng nhập lý do khóa người dùng");
      return;
    }

    await updateUserStatus(banningUser, reason);
  };

  return (
    <section className="px-5 py-6 md:px-8">
      <div className="space-y-5">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-gray-300 bg-white p-5">
            <p className="text-[1.3rem] font-semibold uppercase text-gray-500">
              Tổng người dùng
            </p>
            <p className="mt-2 text-[2.8rem] font-semibold">
              {counts.active + counts.banned}
            </p>
          </div>
          <div className="rounded-lg border border-gray-300 bg-white p-5">
            <p className="text-[1.3rem] font-semibold uppercase text-gray-500">
              Đang hoạt động
            </p>
            <p className="mt-2 text-[2.8rem] font-semibold text-emerald-600">
              {counts.active}
            </p>
          </div>
          <div className="rounded-lg border border-gray-300 bg-white p-5">
            <p className="text-[1.3rem] font-semibold uppercase text-gray-500">
              Đã khóa
            </p>
            <p className="mt-2 text-[2.8rem] font-semibold text-red-600">
              {counts.banned}
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-gray-300 bg-white p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <form onSubmit={handleSearch} className="flex h-18 flex-1 gap-3">
              <div className="relative flex-1">
                <FontAwesomeIcon
                  icon={faMagnifyingGlass}
                  className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  type="text"
                  placeholder="Tìm theo tên, email hoặc số điện thoại"
                  className="h-full w-full rounded-lg border border-gray-300 bg-gray-50 pl-14 pr-4 outline-none transition-colors focus:border-amber-400 focus:bg-white"
                />
              </div>
              <button
                type="submit"
                className="flex h-full items-center justify-center gap-3 rounded-lg bg-blue-600 px-5 font-medium text-white transition-colors hover:bg-blue-700"
              >
                <FontAwesomeIcon icon={faMagnifyingGlass} />
                Tìm kiếm
              </button>
            </form>
            <select
              value={status}
              onChange={(e) => {
                setPage(1);
                setStatus(e.target.value);
              }}
              className="h-18 rounded-lg border border-gray-300 bg-white px-4 outline-none focus:border-amber-400"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value={UserStatus.ACTIVE}>Đang hoạt động</option>
              <option value={UserStatus.BANNED}>Đã khóa</option>
            </select>
            <button
              type="button"
              onClick={() => void fetchUsers()}
              className="flex h-18 items-center justify-center gap-3 rounded-lg border border-gray-300 px-5 font-medium text-gray-600 transition-colors hover:bg-gray-50"
            >
              <FontAwesomeIcon icon={faRotateRight} />
              Tải lại
            </button>
          </div>

          <div className="mt-5 overflow-hidden rounded-lg border border-gray-300">
            <div className="hidden grid-cols-[1.2fr_1fr_0.8fr_0.8fr_16rem] bg-gray-100 px-5 py-4 text-[1.3rem] font-semibold uppercase text-gray-500 xl:grid">
              <span>Người dùng</span>
              <span>Liên hệ</span>
              <span>Xác minh</span>
              <span>Trạng thái</span>
              <span>Thao tác</span>
            </div>

            {isLoading ? (
              <AdminUsersSkeleton />
            ) : users.length === 0 ? (
              <div className="flex min-h-[26rem] flex-col items-center justify-center p-8 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
                  <FontAwesomeIcon icon={faUsers} />
                </div>
                <p className="mt-4 font-semibold text-gray-900">
                  Không tìm thấy người dùng
                </p>
                <p className="mt-1 text-gray-500">
                  Thử thay đổi từ khóa hoặc bộ lọc trạng thái.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {users.map((user) => (
                  <article
                    key={user.id}
                    className="grid gap-4 p-5 xl:grid-cols-[1.2fr_1fr_0.8fr_0.8fr_16rem] xl:items-center"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-gray-100">
                        <img
                          src={user.avatar || avatarDefault}
                          alt={user.fullName || user.email}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-semibold">
                          {user.fullName || "Chưa cập nhật tên"}
                        </p>
                        <p className="text-[1.25rem] text-gray-500">
                          ID #{user.id}
                        </p>
                      </div>
                    </div>

                    <div className="min-w-0">
                      <p className="truncate">{user.email}</p>
                      <p className="truncate text-[1.3rem] text-gray-500">
                        {user.phone || "Chưa cập nhật SĐT"}
                      </p>
                    </div>

                    <span
                      className={`inline-flex w-fit rounded-full px-6 py-3 text-[1.4rem] ${
                        user.isVerified
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {user.isVerified ? "Đã xác minh" : "Chưa xác minh"}
                    </span>

                    <span
                      className={`inline-flex w-fit rounded-full px-6 py-3 text-[1.4rem] ${statusBadgeClasses[user.status]}`}
                    >
                      {statusLabels[user.status]}
                    </span>
                    {user.status === UserStatus.BANNED && user.banReason && (
                      <p className="text-[1.25rem] text-red-600 xl:col-start-2 xl:col-end-5">
                        Lý do khóa: {user.banReason}
                      </p>
                    )}

                    <div className="flex flex-col gap-2 xl:col-start-5 xl:row-start-1 xl:self-center">
                      <button
                        type="button"
                        onClick={() => handleOpenDetailPage(user)}
                        className="flex h-16 items-center justify-center gap-2 rounded-lg border border-blue-200 px-4 text-blue-700 transition-colors hover:bg-blue-50"
                      >
                        <FontAwesomeIcon icon={faEye} />
                        Chi tiết
                      </button>
                      <button
                        type="button"
                        disabled={updatingId === user.id}
                        onClick={() =>
                          user.status === UserStatus.BANNED
                            ? void updateUserStatus(user)
                            : handleOpenBanModal(user)
                        }
                        className={`flex h-16 items-center justify-center gap-2 rounded-lg border px-4 transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                          user.status === UserStatus.BANNED
                            ? "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                            : "border-red-200 text-red-700 hover:bg-red-50"
                        }`}
                      >
                        <FontAwesomeIcon
                          icon={
                            user.status === UserStatus.BANNED
                              ? faLockOpen
                              : faBan
                          }
                        />
                        {user.status === UserStatus.BANNED ? "Mở khóa" : "Khóa"}
                      </button>
                    </div>
                  </article>
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
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                className="h-12 rounded-lg border border-gray-300 px-5 font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Trước
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() =>
                  setPage((prev) => Math.min(prev + 1, totalPages))
                }
                className="h-12 rounded-lg border border-gray-300 px-5 font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Sau
              </button>
            </div>
          </div>
        </div>
      </div>

      {selectedUserDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="max-h-[90vh] w-full max-w-[72rem] overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 items-center gap-4">
                <div className="h-20 w-20 overflow-hidden rounded-full bg-gray-100">
                  <img
                    src={selectedUserDetail.user.avatar || avatarDefault}
                    alt={
                      selectedUserDetail.user.fullName ||
                      selectedUserDetail.user.email
                    }
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <h2 className="truncate text-[2rem] font-semibold">
                    {selectedUserDetail.user.fullName || "Chưa cập nhật tên"}
                  </h2>
                  <p className="text-[1.4rem] text-gray-500">
                    ID #{selectedUserDetail.user.id}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUserDetail(null)}
                className="rounded-lg px-3 py-2 text-gray-500 transition-colors hover:bg-gray-100"
              >
                <FontAwesomeIcon icon={faClose} />
              </button>
            </div>

            {isDetailLoading ? (
              <div className="mt-6 rounded-lg border border-gray-200 p-6 text-center text-gray-500">
                Đang tải chi tiết người dùng...
              </div>
            ) : (
              <>
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <div className="rounded-lg border border-gray-200 p-4">
                    <p className="text-[1.25rem] font-semibold uppercase text-gray-500">
                      Email
                    </p>
                    <p className="mt-2 break-all text-gray-900">
                      {selectedUserDetail.user.email}
                    </p>
                  </div>
                  <div className="rounded-lg border border-gray-200 p-4">
                    <p className="text-[1.25rem] font-semibold uppercase text-gray-500">
                      Số điện thoại
                    </p>
                    <p className="mt-2 text-gray-900">
                      {selectedUserDetail.user.phone || "Chưa cập nhật"}
                    </p>
                  </div>
                  <div className="rounded-lg border border-gray-200 p-4">
                    <p className="text-[1.25rem] font-semibold uppercase text-gray-500">
                      Trạng thái
                    </p>
                    <span
                      className={`mt-2 inline-flex rounded-full px-4 py-2 text-[1.3rem] ${statusBadgeClasses[selectedUserDetail.user.status]}`}
                    >
                      {statusLabels[selectedUserDetail.user.status]}
                    </span>
                  </div>
                  <div className="rounded-lg border border-gray-200 p-4">
                    <p className="text-[1.25rem] font-semibold uppercase text-gray-500">
                      Xác minh
                    </p>
                    <p className="mt-2 text-gray-900">
                      {selectedUserDetail.user.isVerified
                        ? "Đã xác minh"
                        : "Chưa xác minh"}
                    </p>
                  </div>
                  <div className="rounded-lg border border-gray-200 p-4">
                    <p className="text-[1.25rem] font-semibold uppercase text-gray-500">
                      Ngày tạo
                    </p>
                    <p className="mt-2 text-gray-900">
                      {formatDate(selectedUserDetail.user.createdAt)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-gray-200 p-4">
                    <p className="text-[1.25rem] font-semibold uppercase text-gray-500">
                      2FA
                    </p>
                    <p className="mt-2 text-gray-900">
                      {selectedUserDetail.user.two_factor_enabled
                        ? "Đã bật"
                        : "Đã tắt"}
                    </p>
                  </div>
                </div>

                {selectedUserDetail.user.banReason && (
                  <div className="mt-4 rounded-lg border border-red-100 bg-red-50 p-4 text-red-700">
                    <p className="font-semibold">Lý do khóa</p>
                    <p className="mt-1">{selectedUserDetail.user.banReason}</p>
                  </div>
                )}

                <div className="mt-6 rounded-lg border border-gray-200 p-4">
                  <p className="font-semibold text-gray-900">
                    Thống kê tin đăng
                  </p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-lg bg-gray-50 p-4">
                      <p className="text-[1.25rem] text-gray-500">Tổng tin</p>
                      <p className="mt-1 text-[2rem] font-semibold">
                        {selectedUserDetail.postStats.total}
                      </p>
                    </div>
                    <div className="rounded-lg bg-amber-50 p-4">
                      <p className="text-[1.25rem] text-amber-700">Chờ duyệt</p>
                      <p className="mt-1 text-[2rem] font-semibold text-amber-700">
                        {selectedUserDetail.postStats.pending}
                      </p>
                    </div>
                    <div className="rounded-lg bg-emerald-50 p-4">
                      <p className="text-[1.25rem] text-emerald-700">
                        Đang hiển thị
                      </p>
                      <p className="mt-1 text-[2rem] font-semibold text-emerald-700">
                        {selectedUserDetail.postStats.active}
                      </p>
                    </div>
                    <div className="rounded-lg bg-red-50 p-4">
                      <p className="text-[1.25rem] text-red-700">
                        Bị ẩn/từ chối
                      </p>
                      <p className="mt-1 text-[2rem] font-semibold text-red-700">
                        {selectedUserDetail.postStats.hidden +
                          selectedUserDetail.postStats.rejected}
                      </p>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-4">
                      <p className="text-[1.25rem] text-gray-500">Bản nháp</p>
                      <p className="mt-1 text-[2rem] font-semibold">
                        {selectedUserDetail.postStats.draft}
                      </p>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-4">
                      <p className="text-[1.25rem] text-gray-500">Đã bán</p>
                      <p className="mt-1 text-[2rem] font-semibold">
                        {selectedUserDetail.postStats.sold}
                      </p>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-4">
                      <p className="text-[1.25rem] text-gray-500">Hết hạn</p>
                      <p className="mt-1 text-[2rem] font-semibold">
                        {selectedUserDetail.postStats.expired}
                      </p>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-4">
                      <p className="text-[1.25rem] text-gray-500">Cập nhật</p>
                      <p className="mt-1 text-[1.4rem] font-semibold">
                        {formatDate(selectedUserDetail.user.updatedAt)}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {banningUser && (
        <BanUserModal
          userName={banningUser.fullName || banningUser.email}
          reason={banReason}
          isSubmitting={updatingId === banningUser.id}
          onReasonChange={setBanReason}
          onClose={() => setBanningUser(null)}
          onConfirm={() => void handleConfirmBan()}
        />
      )}
    </section>
  );
}

export default AdminUsers;
