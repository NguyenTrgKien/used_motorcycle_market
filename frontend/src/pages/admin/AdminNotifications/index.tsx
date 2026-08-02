import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBell,
  faCheckDouble,
  faCommentDots,
  faFileCircleCheck,
  faInbox,
  faStar,
  faTriangleExclamation,
  faMoneyCheckDollar,
} from "@fortawesome/free-solid-svg-icons";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { io } from "socket.io-client";
import axiosInstance from "../../../configs/axiosInstance";
import {
  NotificationType,
  type NotificationType as NotificationTypeValue,
} from "../../../shared";

interface AdminNotificationItem {
  id: number;
  title: string;
  content: string;
  isRead: boolean;
  type: NotificationTypeValue;
  referenceId: number;
  createdAt: string;
}

interface AdminNotificationsResponse {
  data: AdminNotificationItem[];
  unreadCount: number;
}

type NotificationFilter = "all" | "unread" | "read";

const notificationMeta: Record<
  NotificationTypeValue,
  { icon: IconDefinition; className: string; fallbackPath: string }
> = {
  [NotificationType.POST_APPROVED]: {
    icon: faFileCircleCheck,
    className: "bg-emerald-100 text-emerald-700",
    fallbackPath: "/admin/posts",
  },
  [NotificationType.POST_REJECTED]: {
    icon: faTriangleExclamation,
    className: "bg-red-100 text-red-700",
    fallbackPath: "/admin/posts",
  },
  [NotificationType.NEW_MESSAGE]: {
    icon: faCommentDots,
    className: "bg-blue-100 text-blue-700",
    fallbackPath: "/admin/messages",
  },
  [NotificationType.NEW_REVIEW]: {
    icon: faStar,
    className: "bg-amber-100 text-amber-700",
    fallbackPath: "/admin/notifications",
  },
  [NotificationType.NEW_POST_PENDING]: {
    icon: faBell,
    className: "bg-purple-100 text-purple-700",
    fallbackPath: "/admin/posts/pending",
  },
  [NotificationType.BANK_TRANSFER_SUBMITTED]: {
    icon: faMoneyCheckDollar,
    className: "bg-green-100 text-green-700",
    fallbackPath: "/admin/transactions",
  },
  [NotificationType.BANK_TRANSFER_REJECTED]: {
    icon: faTriangleExclamation,
    className: "bg-red-100 text-red-700",
    fallbackPath: "/posts/manage",
  },
  [NotificationType.BANK_TRANSFER_CONFIRMED]: {
    icon: faFileCircleCheck,
    className: "bg-emerald-100 text-emerald-700",
    fallbackPath: "/posts/manage",
  },
};

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function AdminNotificationsSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={index}
          className="flex gap-4 rounded-lg border border-gray-200 bg-white p-5"
        >
          <div className="h-14 w-14 shrink-0 animate-pulse rounded-full bg-gray-200" />
          <div className="flex-1 space-y-3">
            <div className="h-5 w-2/5 animate-pulse rounded bg-gray-200" />
            <div className="h-4 w-4/5 animate-pulse rounded bg-gray-100" />
            <div className="h-4 w-28 animate-pulse rounded bg-gray-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

function AdminNotifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<AdminNotificationItem[]>(
    [],
  );
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const [filter, setFilter] = useState<NotificationFilter>("all");

  const hasUnread = useMemo(
    () => notifications.some((notification) => !notification.isRead),
    [notifications],
  );

  const filteredNotifications = useMemo(() => {
    if (filter === "unread") {
      return notifications.filter((notification) => !notification.isRead);
    }

    if (filter === "read") {
      return notifications.filter((notification) => notification.isRead);
    }

    return notifications;
  }, [filter, notifications]);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const res = await axiosInstance.get<AdminNotificationsResponse>(
        "/api/v1/notifications",
      );
      setNotifications(res.data.data || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Không thể tải danh sách thông báo",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchNotifications();
  }, []);

  useEffect(() => {
    const socket = io("http://localhost:8080", {
      withCredentials: true,
    });

    socket.on("notification.created", (notification: AdminNotificationItem) => {
      setNotifications((prev) => {
        const exists = prev.some((item) => item.id === notification.id);

        if (exists) return prev;

        return [notification, ...prev];
      });

      if (!notification.isRead) {
        setUnreadCount((prev) => prev + 1);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const getNotificationPath = (notification: AdminNotificationItem) => {
    const meta = notificationMeta[notification.type];
    return meta?.fallbackPath || "/admin/notifications";
  };

  const handleOpenNotification = async (
    notification: AdminNotificationItem,
  ) => {
    if (!notification.isRead) {
      setNotifications((prev) =>
        prev.map((item) =>
          item.id === notification.id ? { ...item, isRead: true } : item,
        ),
      );
      setUnreadCount((prev) => Math.max(prev - 1, 0));

      try {
        await axiosInstance.patch(
          `/api/v1/notifications/${notification.id}/read`,
        );
      } catch (error: any) {
        toast.error(
          error?.response?.data?.message || "Không thể cập nhật thông báo",
        );
        void fetchNotifications();
        return;
      }
    }

    navigate(getNotificationPath(notification), {
      state:
        notification.type === NotificationType.NEW_MESSAGE
          ? { conversationId: notification.referenceId }
          : undefined,
    });
  };

  const handleMarkAllRead = async () => {
    if (!hasUnread) return;

    try {
      setIsMarkingAll(true);
      await axiosInstance.patch("/api/v1/notifications/read-all");
      setNotifications((prev) =>
        prev.map((notification) => ({ ...notification, isRead: true })),
      );
      setUnreadCount(0);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Không thể đánh dấu thông báo",
      );
    } finally {
      setIsMarkingAll(false);
    }
  };

  return (
    <div className="px-5 py-6 md:px-8">
      <div className="mx-auto max-w-[125rem]">
        <div className="mb-5 flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-[2rem] font-medium text-gray-900">
              Thông báo admin
            </h2>
            <p className="mt-1 text-gray-500">
              Bạn có {unreadCount} thông báo chưa đọc
            </p>
          </div>
          <button
            type="button"
            onClick={handleMarkAllRead}
            disabled={!hasUnread || isMarkingAll}
            className="flex h-14 w-fit items-center gap-3 rounded-lg bg-gray-900 px-5 text-[1.4rem] font-medium text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            <FontAwesomeIcon icon={faCheckDouble} />
            {isMarkingAll ? "Dang cap nhat..." : "Danh dau da doc"}
          </button>
        </div>

        <div className="mb-5 flex rounded-lg border border-gray-200 bg-white p-1">
          {[
            { value: "all", label: "Tất cả" },
            { value: "unread", label: "Chưa đọc" },
            { value: "read", label: "Đã đọc" },
          ].map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setFilter(item.value as NotificationFilter)}
              className={`h-16 flex-1 rounded-md px-4 text-[1.35rem] font-medium transition-colors ${
                filter === item.value
                  ? "bg-amber-500 text-white"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <AdminNotificationsSkeleton />
        ) : notifications.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white p-10 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 text-gray-400">
              <FontAwesomeIcon icon={faInbox} className="text-[2.6rem]" />
            </div>
            <h2 className="mt-5 text-[2rem] text-gray-900">
              Chưa có thông báo
            </h2>
            <p className="mt-2 text-gray-500">
              Các cập nhật quản trị sẽ xuất hiện tại đây.
            </p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-gray-500">
            Không có thông báo phù hợp cho phụ lọc này.
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((notification) => {
              const meta = notificationMeta[notification.type] || {
                icon: faBell,
                className: "bg-gray-100 text-gray-700",
                fallbackPath: "/admin/notifications",
              };

              return (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => void handleOpenNotification(notification)}
                  className={`flex w-full gap-4 rounded-lg border p-5 text-left transition-colors hover:border-orange-200 hover:bg-orange-50 ${
                    notification.isRead
                      ? "border-gray-200 bg-white"
                      : "border-orange-200 bg-orange-50/60"
                  }`}
                >
                  <span
                    className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full ${meta.className}`}
                  >
                    <FontAwesomeIcon icon={meta.icon} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-start justify-between gap-4">
                      <span className="font-semibold text-gray-900">
                        {notification.title}
                      </span>
                      {!notification.isRead && (
                        <span className="mt-2 h-3 w-3 shrink-0 rounded-full bg-orange-500" />
                      )}
                    </span>
                    <span className="mt-1 block text-gray-600">
                      {notification.content}
                    </span>
                    <span className="mt-3 block text-[1.3rem] text-gray-400">
                      {formatDate(notification.createdAt)}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminNotifications;
