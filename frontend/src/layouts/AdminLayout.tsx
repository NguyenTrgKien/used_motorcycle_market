import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBell,
  faChartLine,
  faComments,
  faFlag,
  faGaugeHigh,
  faLayerGroup,
  faMotorcycle,
  faRightFromBracket,
  faShieldHalved,
  faStore,
  faUsers,
  faIdCard,
  faMoneyCheckDollar,
  faTags,
} from "@fortawesome/free-solid-svg-icons";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { io, Socket } from "socket.io-client";
import avatarDefault from "../assets/images/avatar_default.png";
import { useAuth } from "../hooks/useAuth";
import { useUser } from "../hooks/useUser";
import {
  NotificationType,
  type NotificationType as NotificationTypeValue,
  UserRole,
} from "../shared";
import axiosInstance from "../configs/axiosInstance";
import TransactionNotificationModal from "../components/TransactionNotificationModal";

interface AdminNotification {
  id: number;
  title: string;
  content: string;
  isRead: boolean;
  type: NotificationTypeValue;
  referenceId: number;
  createdAt: string;
}

interface AdminNotificationsResponse {
  data: AdminNotification[];
  unreadCount: number;
}

const adminNavItems = [
  {
    label: "Tổng quan",
    icon: faGaugeHigh,
    path: "/admin/dashboard",
    roles: [UserRole.ADMIN],
  },
  {
    label: "Doanh thu",
    icon: faChartLine,
    path: "/admin/revenue",
    roles: [UserRole.ADMIN],
  },
  {
    label: "Bảng giá & dịch vụ",
    icon: faTags,
    path: "/admin/monetization",
    roles: [UserRole.ADMIN],
  },
  {
    label: "Xử lý giao dịch",
    icon: faMoneyCheckDollar,
    path: "/admin/transactions",
    roles: [UserRole.ADMIN],
  },

  {
    label: "Kiểm duyệt tin",
    icon: faShieldHalved,
    path: "/admin/posts/pending",
    roles: [UserRole.ADMIN, UserRole.MODERATOR],
  },
  {
    label: "Quản lý tin",
    icon: faMotorcycle,
    path: "/admin/posts",
    roles: [UserRole.ADMIN],
  },
  {
    label: "Người dùng",
    icon: faUsers,
    path: "/admin/users",
    roles: [UserRole.ADMIN],
  },
  {
    label: "Người bán chuyên",
    icon: faStore,
    path: "/admin/professional-sellers",
    roles: [UserRole.ADMIN],
  },
  {
    label: "Xác minh danh tính",
    icon: faIdCard,
    path: "/admin/identity-verifications",
    roles: [UserRole.ADMIN],
  },
  {
    label: "Danh mục & hãng xe",
    icon: faLayerGroup,
    path: "/admin/catalog",
    roles: [UserRole.ADMIN],
  },
  {
    label: "Nhân viên",
    icon: faShieldHalved,
    path: "/admin/staff",
    roles: [UserRole.ADMIN],
  },
  {
    label: "Báo cáo vi phạm",
    icon: faFlag,
    path: "/admin/reports",
    roles: [UserRole.ADMIN, UserRole.CSKH],
  },
  {
    label: "Thông báo",
    icon: faBell,
    path: "/admin/notifications",
    roles: [UserRole.ADMIN, UserRole.MODERATOR, UserRole.CSKH],
  },
  {
    label: "Tin nhắn",
    icon: faComments,
    path: "/admin/messages",
    roles: [UserRole.ADMIN, UserRole.MODERATOR, UserRole.CSKH],
  },
];

const pageTitles: Record<string, { eyebrow: string; title: string }> = {
  "/admin/dashboard": {
    eyebrow: "Quản trị hệ thống",
    title: "Dashboard admin",
  },
  "/admin/posts/pending": {
    eyebrow: "Kiểm duyệt tin đăng",
    title: "Tin đang chờ duyệt",
  },
  "/admin/posts": {
    eyebrow: "Quản lý tin đăng",
    title: "Tất cả tin đăng",
  },
  "/admin/staff": {
    eyebrow: "Phân quyền nhân sự",
    title: "Quản lý nhân viên",
  },
  "/admin/users": {
    eyebrow: "Quản lý tài khoản",
    title: "Quản lý người dùng",
  },
  "/admin/professional-sellers": {
    eyebrow: "Xác minh kinh doanh",
    title: "Người bán chuyên",
  },
  "/admin/identity-verifications": {
    eyebrow: "Xác minh người dùng",
    title: "Hồ sơ xác minh danh tính",
  },
  "/admin/catalog": {
    eyebrow: "Cấu hình dữ liệu",
    title: "Danh mục và hãng xe",
  },
  "/admin/revenue": {
    eyebrow: "Báo cáo thanh toán",
    title: "Doanh thu đăng tin",
  },
  "/admin/transactions": {
    eyebrow: "Thanh toán đăng tin",
    title: "Xử lý giao dịch",
  },
  "/admin/monetization": {
    eyebrow: "Cấu hình doanh thu",
    title: "Bảng giá và dịch vụ",
  },
  "/admin/messages": {
    eyebrow: "Hỗ trợ khách hàng",
    title: "Tin nhắn",
  },
  "/admin/reports": {
    eyebrow: "Hỗ trợ khách hàng",
    title: "Báo cáo vi phạm",
  },
  "/admin/notifications": {
    eyebrow: "Trung tâm thông báo",
    title: "Thông báo admin",
  },
};

function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUser();
  const { logout, isLoading } = useAuth();
  const notificationRef = useRef<HTMLDivElement>(null);
  const notificationSocketRef = useRef<Socket | null>(null);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const [transactionNotification, setTransactionNotification] =
    useState<AdminNotification | null>(null);
  const defaultAdminPath =
    user?.role === UserRole.MODERATOR
      ? "/admin/posts/pending"
      : user?.role === UserRole.CSKH
        ? "/admin/notifications"
        : "/admin/dashboard";
  const visibleAdminNavItems = adminNavItems.filter(
    (item) => user?.role && item.roles.includes(user.role),
  );
  const pageTitle = location.pathname.startsWith("/admin/posts/pending/")
        ? {
            eyebrow: "Kiểm duyệt tin đăng",
            title: "Chi tiết tin chờ duyệt",
          }
        : location.pathname.startsWith("/admin/posts/view/")
          ? {
              eyebrow: "Thông tin tin đăng",
              title: "Chi tiết tin đăng",
            }
          : pageTitles[location.pathname] ||
            pageTitles[defaultAdminPath] || {
              eyebrow: "Khu vực quản trị",
              title: "Quản trị hệ thống",
            };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user?.id) {
        setNotifications([]);
        setUnreadNotifications(0);
        return;
      }

      try {
        setIsLoadingNotifications(true);
        const res = await axiosInstance.get<AdminNotificationsResponse>(
          "/api/v1/notifications",
        );
        setNotifications(res.data.data || []);
        setUnreadNotifications(res.data.unreadCount || 0);
      } catch {
        setNotifications([]);
        setUnreadNotifications(0);
      } finally {
        setIsLoadingNotifications(false);
      }
    };

    void fetchNotifications();
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;

    const socket = io("http://localhost:8080", {
      withCredentials: true,
    });

    notificationSocketRef.current = socket;

    socket.on("notification.created", (notification: AdminNotification) => {
      setNotifications((prev) => {
        const exists = prev.some((item) => item.id === notification.id);

        if (exists) return prev;

        return [notification, ...prev].slice(0, 50);
      });

      if (!notification.isRead) {
        setUnreadNotifications((prev) => prev + 1);
      }

      if (notification.type === NotificationType.BANK_TRANSFER_SUBMITTED) {
        setTransactionNotification(notification);
      }
    });

    return () => {
      socket.disconnect();
      notificationSocketRef.current = null;
    };
  }, [user?.id]);

  const formatNotificationDate = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";

    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getNotificationPath = (notification: AdminNotification) => {
    const paths: Record<NotificationTypeValue, string> = {
      [NotificationType.POST_APPROVED]: "/admin/posts",
      [NotificationType.POST_REJECTED]: "/admin/posts",
      [NotificationType.NEW_MESSAGE]: "/admin/messages",
      [NotificationType.NEW_REVIEW]: "/admin/notifications",
      [NotificationType.NEW_POST_PENDING]: "/admin/posts/pending",
      [NotificationType.BANK_TRANSFER_SUBMITTED]: "/admin/transactions",
      [NotificationType.BANK_TRANSFER_REJECTED]: "/posts/manage",
      [NotificationType.BANK_TRANSFER_CONFIRMED]: "/posts/manage",
      [NotificationType.IDENTITY_STATUS_UPDATED]:
        "/admin/identity-verifications",
      [NotificationType.NEW_IDENTITY_APPLICATION]:
        "/admin/identity-verifications",
      [NotificationType.NEW_PROFESSIONAL_SELLER_APPLICATION]:
        "/admin/professional-sellers",
      [NotificationType.NEW_REPORT]: "/admin/reports",
      [NotificationType.REPORT_STATUS_UPDATED]: "/notifications",
    };

    return paths[notification.type] || "/admin/dashboard";
  };

  const handleOpenNotification = async (notification: AdminNotification) => {
    if (!notification.isRead) {
      setNotifications((prev) =>
        prev.map((item) =>
          item.id === notification.id ? { ...item, isRead: true } : item,
        ),
      );
      setUnreadNotifications((prev) => Math.max(prev - 1, 0));

      try {
        await axiosInstance.patch(
          `/api/v1/notifications/${notification.id}/read`,
        );
      } catch {
        setNotifications((prev) =>
          prev.map((item) =>
            item.id === notification.id ? { ...item, isRead: false } : item,
          ),
        );
        setUnreadNotifications((prev) => prev + 1);
        return;
      }
    }

    setShowNotifications(false);
    navigate(getNotificationPath(notification), {
      state:
        notification.type === NotificationType.NEW_MESSAGE
          ? { conversationId: notification.referenceId }
          : undefined,
    });
  };

  const handleConfirmLogout = async () => {
    await logout();
    setShowLogoutConfirm(false);
  };

  return (
    <div className="min-h-screen bg-[#f4f6f8] text-gray-900">
      <aside className="fixed left-0 top-0 hidden h-screen w-[28rem] overflow-hidden border-r border-gray-200 bg-[#111827] text-white shadow-2xl lg:block">
        <div className="absolute inset-x-0 top-0 h-56 bg-gradient-to-br from-amber-500/25 via-orange-500/10 to-transparent" />
        <div className="relative flex h-full flex-col px-5 py-6">
          <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 shadow-lg shadow-black/10">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-[2rem] font-bold text-gray-950 shadow-lg shadow-amber-500/20">
                A
              </div>
              <div>
                <p className="text-[2.2rem] font-semibold leading-tight">
                  Admin Panel
                </p>
              </div>
            </div>
          </div>

          <nav className="mt-8 min-h-0 flex-1 space-y-2 overflow-y-auto pr-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {visibleAdminNavItems.map((item) => {
              const isActive =
                location.pathname === item.path ||
                (item.path === "/admin/posts/pending" &&
                  location.pathname.startsWith("/admin/posts/pending/"));

              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => navigate(item.path)}
                  className={`group relative flex h-18 w-full items-center gap-3 rounded-xl px-3.5 text-left text-[1.45rem] font-medium transition-all ${
                    isActive
                      ? "bg-white text-gray-950 shadow-lg shadow-black/20"
                      : "text-gray-300 hover:bg-white/[0.15] hover:text-white"
                  }`}
                >
                  <span
                    className={`absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full transition-all ${
                      isActive
                        ? "bg-amber-500 opacity-100"
                        : "bg-white/50 opacity-0 group-hover:opacity-100"
                    }`}
                  />
                  <span
                    className={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${
                      isActive
                        ? "bg-amber-100 text-amber-700"
                        : "bg-white/[0.08] text-gray-300 group-hover:bg-white/10 group-hover:text-amber-200"
                    }`}
                  >
                    <FontAwesomeIcon
                      icon={item.icon}
                      className="text-[1.55rem]"
                    />
                  </span>
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="mt-4 shrink-0 space-y-3">
            <button
              type="button"
              onClick={() => setShowLogoutConfirm(true)}
              className="flex h-14 w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/[0.06] text-[1.35rem] font-medium text-gray-200 transition-colors hover:border-red-400/30 hover:bg-red-500/10 hover:text-red-100"
            >
              <FontAwesomeIcon icon={faRightFromBracket} />
              Đăng xuất
            </button>
          </div>
        </div>
      </aside>

      <main className="lg:pl-[28rem]">
        <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/95 px-5 py-4 backdrop-blur md:px-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[1.3rem] uppercase tracking-[0.08em] text-amber-600">
                {pageTitle.eyebrow}
              </p>
              <h1 className="text-[2.2rem] font-medium md:text-[2.8rem]">
                {pageTitle.title}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative" ref={notificationRef}>
                <button
                  type="button"
                  onClick={() => setShowNotifications((prev) => !prev)}
                  className="relative flex h-18 w-18 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-600 hover:cursor-pointer"
                  aria-label="Thong bao"
                >
                  <FontAwesomeIcon icon={faBell} />
                  {unreadNotifications > 0 && (
                    <span className="absolute -right-2 -top-2 flex h-6 min-w-6 items-center justify-center rounded-full bg-red-500 px-1 text-[1rem] text-white">
                      {unreadNotifications > 99 ? "99+" : unreadNotifications}
                    </span>
                  )}
                </button>

                <AnimatePresence>
                  {showNotifications && (
                    <motion.div
                      initial={{ opacity: 0, y: -12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      exit={{ opacity: 0, y: -12 }}
                      className="absolute right-0 top-[calc(100%+1rem)] z-[999] w-[calc(100vw-2rem)] max-w-[45rem] overflow-hidden rounded-xl border border-gray-200 bg-white text-gray-700 shadow-xl"
                    >
                      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                        <div>
                          <p className="font-semibold text-gray-900">
                            Thông báo
                          </p>
                          <p className="text-[1.2rem] text-gray-500">
                            {unreadNotifications} thông báo chưa đọc
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setShowNotifications(false);
                            navigate("/admin/notifications");
                          }}
                          className="text-[1.4rem] font-medium text-amber-600"
                        >
                          Xem tất cả
                        </button>
                      </div>

                      <div className="max-h-[40rem] overflow-y-auto">
                        {isLoadingNotifications ? (
                          <div className="space-y-3 p-5">
                            {Array.from({ length: 3 }).map((_, index) => (
                              <div key={index} className="flex gap-3">
                                <div className="h-10 w-10 animate-pulse rounded-full bg-gray-200" />
                                <div className="flex-1 space-y-2">
                                  <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200" />
                                  <div className="h-3 w-full animate-pulse rounded bg-gray-100" />
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : notifications.length === 0 ? (
                          <div className="p-8 text-center text-gray-500">
                            Chưa có thông báo
                          </div>
                        ) : (
                          notifications.slice(0, 7).map((notification) => (
                            <button
                              key={notification.id}
                              type="button"
                              onClick={() =>
                                void handleOpenNotification(notification)
                              }
                              className={`flex w-full gap-3 border-b border-gray-100 px-5 py-4 text-left transition-colors last:border-b-0 ${
                                notification.isRead
                                  ? "bg-white"
                                  : "bg-amber-50/70"
                              }`}
                            >
                              <span className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                                <FontAwesomeIcon icon={faBell} />
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="flex items-start justify-between gap-3">
                                  <span className="line-clamp-1 font-semibold text-gray-900">
                                    {notification.title}
                                  </span>
                                  {!notification.isRead && (
                                    <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-amber-500" />
                                  )}
                                </span>
                                <span className="mt-1 line-clamp-2 text-[1.4rem] text-gray-600">
                                  {notification.content}
                                </span>
                                <span className="mt-2 block text-[1.2rem] text-gray-400">
                                  {formatNotificationDate(
                                    notification.createdAt,
                                  )}
                                </span>
                              </span>
                            </button>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <div className="flex items-center gap-3 rounded-lg border border-gray-300 bg-white w-auto h-18 px-10">
                <img
                  src={user?.avatar || avatarDefault}
                  alt="Avatar admin"
                  className="h-10 w-10 rounded-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="hidden text-left sm:block">
                  <p className="text-[1.4rem] font-semibold">
                    {user?.fullName || "Admin"}
                  </p>
                  <p className="text-[1.2rem] text-gray-500">
                    {user?.email || "admin@system.local"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <Outlet key={location.key} />
      </main>

      <TransactionNotificationModal
        notification={transactionNotification}
        onClose={() => setTransactionNotification(null)}
        onView={(notification) => {
          void handleOpenNotification(notification);
          setTransactionNotification(null);
        }}
      />

      <AnimatePresence>
        {showLogoutConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[999] flex items-center justify-center bg-black/40 px-5"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.18 }}
              className="w-full max-w-[42rem] rounded-2xl bg-white p-10 shadow-2xl"
            >
              <div className="flex items-start gap-4">
                <div>
                  <h2 className="text-[2rem] font-semibold text-gray-950">
                    Bạn muốn đăng xuất?
                  </h2>
                  <p className="mt-2 text-[1.4rem] leading-7 text-gray-600">
                    Bạn có chắc chắn muốn đăng xuất khỏi trang quản trị không?
                  </p>
                </div>
              </div>

              <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setShowLogoutConfirm(false)}
                  disabled={isLoading}
                  className="h-18 rounded-lg border border-gray-300 px-6 text-[1.35rem] font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={() => void handleConfirmLogout()}
                  disabled={isLoading}
                  className="h-18 rounded-lg bg-red-600 px-10 text-[1.35rem] font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isLoading ? "Đang đăng xuất..." : "Đăng xuất"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default AdminLayout;
