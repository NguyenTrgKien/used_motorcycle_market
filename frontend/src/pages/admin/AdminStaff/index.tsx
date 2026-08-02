import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMagnifyingGlass,
  faRotateRight,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";
import { faEye, faEyeSlash } from "@fortawesome/free-regular-svg-icons";
import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { toast } from "react-toastify";
import axiosInstance from "../../../configs/axiosInstance";
import { UserRole } from "../../../shared";
import type { UserStatus } from "../../../shared";
import avatarDefault from "../../../assets/images/avatar_default.png";

interface StaffUser {
  id: number;
  fullName?: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: UserRole;
  status: UserStatus;
  isVerified: boolean;
  createdAt: string;
}

interface StaffResponse {
  data: {
    items: StaffUser[];
    total: number;
    page: number;
    limit: number;
    counts: {
      admin: number;
      moderator: number;
      cskh: number;
    };
  };
}

const roleLabels: Record<UserRole, string> = {
  [UserRole.ADMIN]: "Quản trị viên",
  [UserRole.MODERATOR]: "Kiểm duyệt viên",
  [UserRole.CSKH]: "CSKH",
  [UserRole.USER]: "Người dùng",
};

const roleBadgeClasses: Record<UserRole, string> = {
  [UserRole.ADMIN]: "bg-gray-900 text-white",
  [UserRole.MODERATOR]: "bg-amber-100 text-amber-700",
  [UserRole.CSKH]: "bg-sky-100 text-sky-700",
  [UserRole.USER]: "bg-gray-100 text-gray-600",
};

const editableRoles = [
  UserRole.MODERATOR,
  UserRole.CSKH,
  UserRole.USER,
] as const;

function AdminStaffSkeleton() {
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

function AdminStaff() {
  const [staff, setStaff] = useState<StaffUser[]>([]);
  const [keyword, setKeyword] = useState("");
  const [appliedKeyword, setAppliedKeyword] = useState("");
  const [role, setRole] = useState("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [counts, setCounts] = useState({ admin: 0, moderator: 0, cskh: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [createFullName, setCreateFullName] = useState("");
  const [createEmail, setCreateEmail] = useState("");
  const [createPhone, setCreatePhone] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [createRole, setCreateRole] = useState<UserRole>(UserRole.MODERATOR);
  const [assignUserId, setAssignUserId] = useState("");
  const [assignRole, setAssignRole] = useState<UserRole>(UserRole.MODERATOR);
  const limit = 10;

  const totalPages = useMemo(
    () => Math.max(Math.ceil(total / limit), 1),
    [total],
  );

  const fetchStaff = async () => {
    try {
      setIsLoading(true);
      const res = await axiosInstance.get<StaffResponse>(
        "/api/v1/users/admin/staff",
        {
          params: {
            page,
            limit,
            keyword: appliedKeyword || undefined,
            role: role === "all" ? undefined : role,
          },
        },
      );

      setStaff(res.data.data.items || []);
      setTotal(res.data.data.total || 0);
      setCounts(res.data.data.counts || { admin: 0, moderator: 0, cskh: 0 });
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Không thể tải danh sách nhân viên",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchStaff();
  }, [page, role, appliedKeyword]);

  const handleSearch = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPage(1);
    setAppliedKeyword(keyword.trim());
  };

  const updateRole = async (userId: number, nextRole: UserRole) => {
    try {
      setUpdatingId(userId);
      const res = await axiosInstance.patch(
        `/api/v1/users/admin/${userId}/role`,
        {
          role: nextRole,
        },
      );
      toast.success(res.data.message || "Đã cập nhật vai trò nhân viên");
      await fetchStaff();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Không thể cập nhật vai trò",
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const handleAssignRole = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const userId = Number(assignUserId);

    if (!userId) {
      toast.error("Vui lòng nhập ID người dùng hợp lệ");
      return;
    }

    await updateRole(userId, assignRole);
    setAssignUserId("");
  };

  const handleCreateStaff = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fullName = createFullName.trim();
    const email = createEmail.trim();
    const password = createPassword.trim();
    const phone = createPhone.trim();

    if (!fullName || !email || !password) {
      toast.error("Vui lòng nhập đầy đủ họ tên, email và mật khẩu");
      return;
    }

    if (password.length < 6) {
      toast.error("Mật khẩu tạm thời phải có ít nhất 6 ký tự");
      return;
    }

    try {
      setIsCreating(true);
      const res = await axiosInstance.post("/api/v1/users/admin/staff", {
        fullName,
        email,
        password,
        role: createRole,
        phone: phone || undefined,
      });
      toast.success(res.data.message || "Đã tạo nhân viên mới");
      setCreateEmail("");
      setCreatePhone("");
      setCreatePassword("");
      setCreateRole(UserRole.MODERATOR);
      setPage(1);
      await fetchStaff();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Không thể tạo nhân viên");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <section className="px-5 py-6 md:px-8">
      <div className="space-y-5">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-gray-300 bg-white p-5">
            <p className="text-[1.3rem] font-semibold uppercase text-gray-500">
              Quản trị viên
            </p>
            <p className="mt-2 text-[2.8rem] font-semibold">{counts.admin}</p>
          </div>
          <div className="rounded-lg border border-gray-300 bg-white p-5">
            <p className="text-[1.3rem] font-semibold uppercase text-gray-500">
              Kiểm duyệt viên
            </p>
            <p className="mt-2 text-[2.8rem] font-semibold text-amber-600">
              {counts.moderator}
            </p>
          </div>
          <div className="rounded-lg border border-gray-300 bg-white p-5">
            <p className="text-[1.3rem] font-semibold uppercase text-gray-500">
              CSKH
            </p>
            <p className="mt-2 text-[2.8rem] font-semibold text-sky-600">
              {counts.cskh}
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-gray-300 bg-white p-5">
          <div className="grid gap-4 xl:grid-cols-[1fr_34rem]">
            <div>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <form onSubmit={handleSearch} className="relative h-18 flex-1">
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
                </form>
                <select
                  value={role}
                  onChange={(e) => {
                    setPage(1);
                    setRole(e.target.value);
                  }}
                  className="h-18 rounded-lg border border-gray-300 bg-white px-4 outline-none focus:border-amber-400"
                >
                  <option value="all">Tất cả vai trò</option>
                  <option value={UserRole.ADMIN}>Quản trị viên</option>
                  <option value={UserRole.MODERATOR}>Kiểm duyệt viên</option>
                  <option value={UserRole.CSKH}>CSKH</option>
                </select>
                <button
                  type="button"
                  onClick={() => void fetchStaff()}
                  className="flex h-18 items-center justify-center gap-3 rounded-lg border border-gray-300 px-5 font-medium text-gray-600 transition-colors hover:bg-gray-50"
                >
                  <FontAwesomeIcon icon={faRotateRight} />
                  Tải lại
                </button>
              </div>

              <div className="mt-5 overflow-hidden rounded-lg border border-gray-300">
                <div className="hidden grid-cols-[1.2fr_1fr_0.8fr_0.8fr_16rem] bg-gray-100 px-5 py-4 text-[1.3rem] font-semibold uppercase text-gray-500 xl:grid">
                  <span>Nhân viên</span>
                  <span>Liên hệ</span>
                  <span>Vai trò</span>
                  <span>Trạng thái</span>
                  <span>Cập nhật</span>
                </div>

                {isLoading ? (
                  <AdminStaffSkeleton />
                ) : staff.length === 0 ? (
                  <div className="flex min-h-[26rem] flex-col items-center justify-center p-8 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
                      <FontAwesomeIcon icon={faUsers} />
                    </div>
                    <p className="mt-4 font-semibold text-gray-900">
                      Chưa có nhân viên phù hợp
                    </p>
                    <p className="mt-1 text-gray-500">
                      Thử thay đổi bộ lọc hoặc gán vai trò cho user hiện có.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {staff.map((item) => (
                      <article
                        key={item.id}
                        className="grid gap-4 p-5 xl:grid-cols-[1.2fr_1fr_0.8fr_0.8fr_16rem] xl:items-center"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-gray-100 text-gray-500">
                            <img
                              src={item.avatar || avatarDefault}
                              alt={item.fullName || item.email}
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-semibold">
                              {item.fullName || "Chưa cập nhật tên"}
                            </p>
                            <p className="text-[1.25rem] text-gray-500">
                              ID #{item.id}
                            </p>
                          </div>
                        </div>

                        <div className="min-w-0">
                          <p className="truncate">{item.email}</p>
                          <p className="truncate text-[1.3rem] text-gray-500">
                            {item.phone || "Chưa cập nhật SĐT"}
                          </p>
                        </div>

                        <span
                          className={`inline-flex w-fit rounded-full px-3 py-1 text-[1.2rem] font-semibold ${roleBadgeClasses[item.role]}`}
                        >
                          {roleLabels[item.role]}
                        </span>

                        <span className="capitalize text-gray-600">
                          {item.status}
                        </span>

                        <select
                          value={item.role}
                          disabled={
                            item.role === UserRole.ADMIN ||
                            updatingId === item.id
                          }
                          onChange={(e) =>
                            void updateRole(item.id, e.target.value as UserRole)
                          }
                          className="h-12 rounded-lg border border-gray-300 bg-white px-3 outline-none transition-colors focus:border-amber-400 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
                        >
                          {item.role === UserRole.ADMIN && (
                            <option value={UserRole.ADMIN}>
                              Quản trị viên
                            </option>
                          )}
                          {editableRoles.map((itemRole) => (
                            <option key={itemRole} value={itemRole}>
                              {roleLabels[itemRole]}
                            </option>
                          ))}
                        </select>
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

            <div className="space-y-4">
              <form
                onSubmit={handleCreateStaff}
                className="h-fit rounded-lg border border-gray-300 bg-gray-50 p-5"
              >
                <h2 className="text-[1.8rem] font-semibold">
                  Thêm nhân viên mới
                </h2>
                <div className="mt-5 space-y-4">
                  <label className="block">
                    <span className="text-[1.3rem] font-semibold text-gray-600">
                      Họ tên
                    </span>
                    <input
                      value={createFullName}
                      onChange={(e) => setCreateFullName(e.target.value)}
                      type="text"
                      className="mt-2 h-18 w-full rounded-lg border border-gray-300 bg-white px-4 outline-none focus:border-amber-400"
                      placeholder="Nhập họ tên"
                    />
                  </label>

                  <label className="block">
                    <span className="text-[1.3rem] font-semibold text-gray-600">
                      Email
                    </span>
                    <input
                      value={createEmail}
                      onChange={(e) => setCreateEmail(e.target.value)}
                      type="email"
                      className="mt-2 h-18 w-full rounded-lg border border-gray-300 bg-white px-4 outline-none focus:border-amber-400"
                      placeholder="name@example.com"
                    />
                  </label>

                  <label className="block">
                    <span className="text-[1.3rem] font-semibold text-gray-600">
                      Số điện thoại
                    </span>
                    <input
                      value={createPhone}
                      onChange={(e) => setCreatePhone(e.target.value)}
                      type="tel"
                      className="mt-2 h-18 w-full rounded-lg border border-gray-300 bg-white px-4 outline-none focus:border-amber-400"
                      placeholder="Không bắt buộc"
                    />
                  </label>

                  <label className="block">
                    <span className="text-[1.3rem] font-semibold text-gray-600">
                      Mật khẩu tạm thời
                    </span>
                    <div className="relative mt-2">
                      <input
                        value={createPassword}
                        onChange={(e) => setCreatePassword(e.target.value)}
                        type={showCreatePassword ? "text" : "password"}
                        className="h-18 w-full rounded-lg border border-gray-300 bg-white pl-4 pr-12 outline-none focus:border-amber-400"
                        placeholder="Tối thiểu 6 ký tự"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCreatePassword((prev) => !prev)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 transition-colors hover:text-gray-900"
                        aria-label={
                          showCreatePassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"
                        }
                      >
                        <FontAwesomeIcon
                          icon={showCreatePassword ? faEyeSlash : faEye}
                        />
                      </button>
                    </div>
                  </label>

                  <label className="block">
                    <span className="text-[1.3rem] font-semibold text-gray-600">
                      Vai trò
                    </span>
                    <select
                      value={createRole}
                      onChange={(e) =>
                        setCreateRole(e.target.value as UserRole)
                      }
                      className="mt-2 h-18 w-full rounded-lg border border-gray-300 bg-white px-4 outline-none focus:border-amber-400"
                    >
                      <option value={UserRole.MODERATOR}>
                        {roleLabels[UserRole.MODERATOR]}
                      </option>
                      <option value={UserRole.CSKH}>
                        {roleLabels[UserRole.CSKH]}
                      </option>
                    </select>
                  </label>

                  <button
                    type="submit"
                    disabled={isCreating}
                    className="flex h-18 w-full items-center justify-center rounded-lg bg-amber-600 font-semibold text-white transition-colors hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isCreating ? "Đang xử lý..." : "Tạo nhân viên"}
                  </button>
                </div>
              </form>

              <form
                onSubmit={handleAssignRole}
                className="h-fit rounded-lg border border-gray-300 bg-gray-50 p-5"
              >
                <h2 className="text-[1.8rem] font-semibold">Gán vai trò</h2>
                <div className="mt-5 space-y-4">
                  <label className="block">
                    <span className="text-[1.3rem] font-semibold text-gray-600">
                      ID người dùng
                    </span>
                    <input
                      value={assignUserId}
                      onChange={(e) => setAssignUserId(e.target.value)}
                      type="number"
                      min="1"
                      className="mt-2 h-18 w-full rounded-lg border border-gray-300 bg-white px-4 outline-none focus:border-amber-400"
                      placeholder="Nhập ID user"
                    />
                  </label>

                  <label className="block">
                    <span className="text-[1.3rem] font-semibold text-gray-600">
                      Vai trò mới
                    </span>
                    <select
                      value={assignRole}
                      onChange={(e) =>
                        setAssignRole(e.target.value as UserRole)
                      }
                      className="mt-2 h-18 w-full rounded-lg border border-gray-300 bg-white px-4 outline-none focus:border-amber-400"
                    >
                      {editableRoles.map((itemRole) => (
                        <option key={itemRole} value={itemRole}>
                          {roleLabels[itemRole]}
                        </option>
                      ))}
                    </select>
                  </label>

                  <button
                    type="submit"
                    disabled={updatingId !== null}
                    className="flex h-18 w-full items-center justify-center rounded-lg bg-gray-900 font-semibold text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Cập nhật vai trò
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default AdminStaff;
