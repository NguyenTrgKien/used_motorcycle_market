import {
  faAngleRight,
  faEnvelope,
  faLocationDot,
  faPhone,
  faRotateRight,
  faShieldHalved,
  faUser,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import axiosInstance from "../../../configs/axiosInstance";
import type { UserType } from "../../../types/user.type";

interface PublicUserResponse {
  message: string;
  data: UserType;
}

function usePublicUser(userId?: string) {
  return useQuery<UserType>({
    queryKey: ["public-user", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const res = await axiosInstance.get<PublicUserResponse>(
        `/api/v1/users/${userId}`,
      );
      return res.data.data;
    },
  });
}

function PublicProfile() {
  const { id } = useParams();
  const {
    data: user,
    isLoading: userLoading,
    isError: userError,
    refetch: refetchUser,
  } = usePublicUser(id);
  const joinedAt = user?.createdAt
    ? new Intl.DateTimeFormat("vi-VN", {
        month: "2-digit",
        year: "numeric",
      }).format(new Date(user.createdAt))
    : "Chưa ghi nhận";

  if (userLoading) {
    return (
      <div className="px-[10rem] pt-[9rem]">
        <div className="rounded-xl border border-gray-200 bg-white p-8">
          <div className="flex items-center gap-5">
            <div className="h-24 w-24 animate-pulse rounded-full bg-gray-200" />
            <div className="flex-1 space-y-3">
              <div className="h-6 w-1/3 animate-pulse rounded bg-gray-200" />
              <div className="h-4 w-1/4 animate-pulse rounded bg-gray-200" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (userError || !user) {
    return (
      <div className="px-[10rem] pt-[9rem]">
        <div className="rounded-xl border border-red-100 bg-red-50 p-8">
          <p className="text-[1.5rem] text-red-600">
            Không thể tải hồ sơ người dùng
          </p>
          <button
            onClick={() => void refetchUser()}
            className="mt-4 inline-flex h-[3.8rem] items-center gap-2 rounded-xl border border-red-200 px-4 text-[1.4rem] text-red-600"
          >
            <FontAwesomeIcon icon={faRotateRight} />
            Tải lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-[10rem] pt-[9rem] pb-[4rem]">
      <div className="grid grid-cols-[1fr_34rem] gap-8">
        <div className="flex flex-col gap-6">
          <section className="rounded-xl border border-gray-200 bg-white p-8">
            <div className="flex items-start gap-5">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={`avatar-${user.fullName}`}
                  referrerPolicy="no-referrer"
                  className="h-24 w-24 rounded-full border border-gray-200 object-cover"
                />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-cyan-100 text-[2.2rem] font-semibold text-blue-800">
                  {user.fullName?.slice(0, 2).toUpperCase() || "ND"}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-[2.6rem] font-medium text-gray-900">
                    {user.fullName || "Người dùng"}
                  </h1>
                  {user.isVerified && (
                    <span className="inline-flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-3 py-[3px] text-[1.2rem] text-green-600">
                      <FontAwesomeIcon icon={faShieldHalved} />
                      Đã xác minh
                    </span>
                  )}
                </div>
                <p className="mt-2 text-[1.4rem] text-gray-500">
                  Thành viên từ {joinedAt}
                </p>
                {user.personalInfo && (
                  <p className="mt-4 text-[1.5rem] leading-relaxed text-gray-600">
                    {user.personalInfo}
                  </p>
                )}
              </div>
            </div>
          </section>
        </div>

        <aside className="flex flex-col gap-6">
          <section className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="text-[1.8rem] font-medium text-gray-900">
              Card người bán
            </h2>
            <div className="mt-5 flex items-center gap-4">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={`seller-${user.fullName}`}
                  referrerPolicy="no-referrer"
                  className="h-16 w-16 rounded-full border border-gray-200 object-cover"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-cyan-100 text-[1.8rem] font-semibold text-blue-800">
                  {user.fullName?.slice(0, 2).toUpperCase() || "ND"}
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate text-[1.6rem] font-medium text-gray-900">
                  {user.fullName || "Người bán"}
                </p>
                <p className="mt-1 text-[1.3rem] text-gray-500">
                  {user.isVerified ? "Đã xác minh" : "Chưa xác minh"}
                </p>
              </div>
            </div>

            <Link
              to={`/users/${user.id}`}
              className="mt-5 flex h-[4rem] items-center justify-center gap-2 rounded-xl border border-gray-300 text-[1.4rem] text-gray-700 transition-colors hover:bg-gray-50"
            >
              Xem hồ sơ người bán
              <FontAwesomeIcon icon={faAngleRight} />
            </Link>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="text-[1.8rem] font-medium text-gray-900">
              Liên hệ người bán
            </h2>
            <div className="mt-5 flex flex-col gap-3">
              {user.phone && (
                <a
                  href={`tel:${user.phone}`}
                  className="flex h-[4.2rem] items-center gap-3 rounded-xl border border-gray-300 px-4 text-[1.4rem] text-gray-700 transition-colors hover:bg-gray-50"
                >
                  <FontAwesomeIcon icon={faPhone} className="text-gray-400" />
                  {user.phone}
                </a>
              )}
              {user.email && (
                <a
                  href={`mailto:${user.email}`}
                  className="flex h-[4.2rem] items-center gap-3 rounded-xl border border-gray-300 px-4 text-[1.4rem] text-gray-700 transition-colors hover:bg-gray-50"
                >
                  <FontAwesomeIcon
                    icon={faEnvelope}
                    className="text-gray-400"
                  />
                  {user.email}
                </a>
              )}
              {!user.phone && !user.email && (
                <div className="rounded-xl bg-gray-50 px-4 py-5 text-center">
                  <FontAwesomeIcon
                    icon={faUser}
                    className="text-[2rem] text-gray-300"
                  />
                  <p className="mt-2 text-[1.3rem] text-gray-500">
                    Người bán chưa công khai thông tin liên hệ
                  </p>
                </div>
              )}
            </div>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-6">
            <div className="flex items-center gap-3 text-[1.4rem] text-gray-500">
              <FontAwesomeIcon icon={faLocationDot} />
              <span>
                {user.addresses?.[0]
                  ? `${user.addresses[0].district}, ${user.addresses[0].province}`
                  : "Chưa công khai địa chỉ"}
              </span>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

export default PublicProfile;
