import {
  faDesktop,
  faMobileScreen,
  faRotateRight,
  faClock,
  faRightFromBracket,
  faShieldHalved,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import axiosInstance from "../../../configs/axiosInstance";

interface LoginSession {
  id: string | number;
  device: string;
  browser?: string | null;
  os?: string | null;
  ipAddress?: string | null;
  lastActiveLabel: string;
  createdAtLabel: string;
  expiredAtLabel: string;
  revokedAtLabel?: string;
  isCurrent: boolean;
  isActive: boolean;
  isDesktop: boolean;
}

interface UserSessionResponse {
  id: number;
  deviceName?: string | null;
  browser?: string | null;
  os?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  expiredAt: string;
  revokedAt?: string | null;
  lastActive?: string | null;
  createdAt: string;
  isActive: boolean;
  isCurrent: boolean;
}

function formatDateTime(value?: string | null) {
  if (!value) return "Chưa ghi nhận";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Chưa ghi nhận";
  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function isDesktopSession(session: UserSessionResponse) {
  const target = `${session.os ?? ""} ${session.userAgent ?? ""}`.toLowerCase();
  if (target.includes("android") || target.includes("iphone")) return false;
  return (
    target.includes("windows") ||
    target.includes("mac") ||
    target.includes("linux")
  );
}

function mapSession(session: UserSessionResponse): LoginSession {
  return {
    id: session.id,
    device:
      session.deviceName ||
      session.browser ||
      session.os ||
      "Thiết bị không xác định",
    browser: session.browser,
    os: session.os,
    ipAddress: session.ipAddress,
    lastActiveLabel: formatDateTime(session.lastActive ?? session.createdAt),
    createdAtLabel: formatDateTime(session.createdAt),
    expiredAtLabel: formatDateTime(session.expiredAt),
    revokedAtLabel: session.revokedAt
      ? formatDateTime(session.revokedAt)
      : undefined,
    isCurrent: session.isCurrent,
    isActive: session.isActive,
    isDesktop: isDesktopSession(session),
  };
}

function useLoginSessions() {
  return useQuery<LoginSession[]>({
    queryKey: ["user-sessions"],
    queryFn: async () => {
      const res = await axiosInstance.get<{ data: UserSessionResponse[] }>(
        "/api/v1/user-session",
      );
      return res.data.data.map(mapSession);
    },
  });
}

function useRevokeSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string | number) =>
      axiosInstance.delete(`/api/v1/user-session/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-sessions"] });
      toast.success("Đã đăng xuất thiết bị");
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Không thể đăng xuất thiết bị",
      );
    },
  });
}

function useRevokeAllSessions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => axiosInstance.delete("/api/v1/user-session/others"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-sessions"] });
      toast.success("Đã đăng xuất tất cả thiết bị khác");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Không thể đăng xuất");
    },
  });
}

function LoginTracking() {
  const {
    data: sessions = [],
    isLoading,
    isError,
    refetch,
  } = useLoginSessions();
  const revokeSessionMutation = useRevokeSession();
  const revokeAllMutation = useRevokeAllSessions();
  const activeSessions = sessions.filter((session) => session.isActive);
  const inactiveSessions = sessions.filter((session) => !session.isActive);
  const canRevokeOthers = activeSessions.some((session) => !session.isCurrent);

  const renderSession = (session: LoginSession) => (
    <div
      key={session.id}
      className="flex items-start justify-between gap-5 rounded-xl border border-gray-400 bg-white px-5 py-4"
    >
      <div className="flex min-w-0 gap-4">
        <span
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border text-[1.7rem] ${
            session.isCurrent
              ? "border-amber-200 bg-white text-amber-600"
              : "border-gray-100 bg-gray-50 text-gray-500"
          }`}
        >
          <FontAwesomeIcon
            icon={session.isDesktop ? faDesktop : faMobileScreen}
          />
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-[1.6rem] font-medium text-gray-900">
              {session.device}
            </h3>
            {session.isCurrent && (
              <span className="rounded-full border border-amber-200 bg-amber-100 px-3 py-[2px] text-[1.2rem] text-amber-700">
                Thiết bị này
              </span>
            )}
            <span
              className={`rounded-full px-3 py-[2px] text-[1.2rem] ${
                session.isActive
                  ? "bg-green-50 text-green-600"
                  : "bg-gray-200 text-gray-500"
              }`}
            >
              {session.isActive ? "Đang hoạt động" : "Đã kết thúc"}
            </span>
          </div>
          <div className="mt-2 grid gap-1 text-[1.3rem] text-gray-500">
            <p>
              {session.browser || "Không rõ trình duyệt"} ·{" "}
              {session.os || "Không rõ hệ điều hành"}
            </p>
            <p>IP: {session.ipAddress || "Không rõ IP"}</p>
            <p>Hoạt động gần nhất: {session.lastActiveLabel}</p>
            <p>Bắt đầu phiên: {session.createdAtLabel}</p>
            <p>
              {session.revokedAtLabel
                ? `Kết thúc phiên: ${session.revokedAtLabel}`
                : `Hết hạn: ${session.expiredAtLabel}`}
            </p>
          </div>
        </div>
      </div>

      {!session.isCurrent && session.isActive && (
        <button
          onClick={() => revokeSessionMutation.mutate(session.id)}
          disabled={
            revokeSessionMutation.isPending &&
            revokeSessionMutation.variables === session.id
          }
          className="inline-flex h-[3.6rem] shrink-0 items-center gap-2 rounded-xl border border-red-200 px-4 text-[1.4rem] text-red-500 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <FontAwesomeIcon icon={faRightFromBracket} />
          {revokeSessionMutation.isPending &&
          revokeSessionMutation.variables === session.id
            ? "Đang xử lý..."
            : "Đăng xuất"}
        </button>
      )}
    </div>
  );

  return (
    <div className="w-full p-[2rem]">
      <div className="border-b border-gray-200 pb-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-[2.2rem] font-medium text-gray-900">
              Lịch sử đăng nhập
            </h2>
            <p className="mt-1 text-[1.4rem] text-gray-500">
              Theo dõi thiết bị, thời gian và trạng thái các phiên đăng nhập
              của tài khoản
            </p>
          </div>
          <button
            onClick={() => void refetch()}
            className="inline-flex h-[3.8rem] shrink-0 items-center gap-2 rounded-xl border border-gray-300 px-4 text-[1.4rem] text-gray-700 transition-colors hover:bg-gray-50"
          >
            <FontAwesomeIcon icon={faRotateRight} />
            Tải lại
          </button>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-500">
              <FontAwesomeIcon icon={faShieldHalved} />
            </span>
            <div>
              <h3 className="text-[1.7rem] font-medium text-gray-900">
                Phiên đăng nhập
              </h3>
              <p className="text-[1.3rem] text-gray-500">
                {activeSessions.length} phiên đang hoạt động ·{" "}
                {inactiveSessions.length} phiên đã kết thúc
              </p>
            </div>
          </div>

          {canRevokeOthers && (
            <button
              onClick={() => revokeAllMutation.mutate()}
              disabled={revokeAllMutation.isPending}
              className="inline-flex h-[3.8rem] items-center gap-2 rounded-xl border border-red-200 px-4 text-[1.4rem] text-red-500 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FontAwesomeIcon icon={faRightFromBracket} />
              {revokeAllMutation.isPending
                ? "Đang xử lý..."
                : "Đăng xuất thiết bị khác"}
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="flex items-center gap-4 rounded-xl bg-gray-50 px-5 py-4"
              >
                <div className="h-12 w-12 shrink-0 animate-pulse rounded-xl bg-gray-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-1/3 animate-pulse rounded bg-gray-200" />
                  <div className="h-3 w-1/2 animate-pulse rounded bg-gray-200" />
                  <div className="h-3 w-2/5 animate-pulse rounded bg-gray-200" />
                </div>
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="rounded-xl border border-red-100 bg-red-50 px-5 py-5">
            <p className="text-[1.4rem] text-red-600">
              Không thể tải lịch sử đăng nhập
            </p>
            <button
              onClick={() => void refetch()}
              className="mt-3 inline-flex items-center gap-2 text-[1.3rem] text-red-600 transition-colors hover:text-red-700"
            >
              <FontAwesomeIcon icon={faRotateRight} />
              Tải lại
            </button>
          </div>
        ) : sessions.length === 0 ? (
          <div className="rounded-xl bg-gray-50 px-5 py-8 text-center">
            <FontAwesomeIcon
              icon={faClock}
              className="text-[2.8rem] text-gray-300"
            />
            <p className="mt-3 text-[1.4rem] text-gray-500">
              Chưa có lịch sử đăng nhập nào được ghi nhận
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">{sessions.map(renderSession)}</div>
        )}
      </div>
    </div>
  );
}

export default LoginTracking;
