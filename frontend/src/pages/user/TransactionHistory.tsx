import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRotateRight,
  faClockRotateLeft,
  faReceipt,
} from "@fortawesome/free-solid-svg-icons";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import axiosInstance from "../../configs/axiosInstance";

type PaymentStatus =
  | "pending"
  | "paid"
  | "failed"
  | "cancelled"
  | "rejected"
  | "expired";

interface PaymentOrder {
  id: string;
  code: string;
  amount: number;
  method: "vnpay" | "momo" | "bank_transfer";
  orderType: "listing" | "featured" | "vip" | "boost" | "subscription";
  status: PaymentStatus;
  planName?: string;
  receiptUrl?: string;
  transferSubmittedAt?: string;
  rejectedReason?: string;
  paidAt?: string;
  expiresAt: string;
  createdAt: string;
  post?: { id: number; title: string; slug: string };
}

const statusMeta: Record<PaymentStatus, { label: string; className: string }> =
  {
    pending: { label: "Đang chờ", className: "bg-amber-100 text-amber-700" },
    paid: { label: "Thành công", className: "bg-green-100 text-green-700" },
    failed: { label: "Thất bại", className: "bg-red-100 text-red-700" },
    cancelled: { label: "Đã hủy", className: "bg-gray-100 text-gray-600" },
    rejected: { label: "Bị từ chối", className: "bg-red-100 text-red-700" },
    expired: { label: "Hết hạn", className: "bg-gray-100 text-gray-600" },
  };

const typeLabels: Record<PaymentOrder["orderType"], string> = {
  listing: "Phí đăng tin",
  featured: "Tin nổi bật",
  vip: "Tin VIP",
  boost: "Đẩy tin",
  subscription: "Gói người bán",
};

const methodLabels: Record<PaymentOrder["method"], string> = {
  vnpay: "VNPay",
  momo: "Ví MoMo",
  bank_transfer: "Chuyển khoản ngân hàng",
};

function TransactionHistorySkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={index}
          className="rounded-2xl border border-gray-200 bg-white p-6"
        >
          <div className="flex items-start justify-between gap-5">
            <div className="flex-1 space-y-3">
              <div className="h-5 w-44 animate-pulse rounded bg-gray-200" />
              <div className="h-4 w-64 max-w-full animate-pulse rounded bg-gray-100" />
              <div className="h-4 w-36 animate-pulse rounded bg-gray-100" />
            </div>
            <div className="h-8 w-24 animate-pulse rounded-full bg-gray-200" />
          </div>
          <div className="mt-5 h-7 w-40 animate-pulse rounded bg-gray-200" />
        </div>
      ))}
    </div>
  );
}

function formatDate(value?: string) {
  if (!value) return "";
  return new Date(value).toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function TransactionHistory() {
  const [orders, setOrders] = useState<PaymentOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadOrders = async (showSkeleton = false) => {
    try {
      if (showSkeleton) setIsLoading(true);
      else setIsRefreshing(true);
      const response = await axiosInstance.get<{ data: PaymentOrder[] }>(
        "/api/v1/listing-payments/orders",
      );
      setOrders(response.data.data || []);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Không thể tải lịch sử giao dịch",
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    void loadOrders(true);
  }, []);

  const pendingCount = useMemo(
    () => orders.filter((order) => order.status === "pending").length,
    [orders],
  );

  return (
    <div className="min-h-screen bg-gray-100 px-5 pb-16 pt-8 md:px-10 lg:px-[16rem]">
      <div className="mx-auto max-w-[110rem]">
        <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-[2.2rem] font-medium text-gray-900">
              Lịch sử giao dịch
            </h1>
            <p className="mt-1 text-gray-500">
              Theo dõi các khoản thanh toán và biên lai đã gửi
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadOrders()}
            disabled={isRefreshing}
            className="flex h-14 w-fit items-center gap-3 rounded-xl border border-gray-300 bg-white px-5 font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <FontAwesomeIcon
              icon={faArrowRotateRight}
              className={isRefreshing ? "animate-spin" : ""}
            />
            Làm mới
          </button>
        </div>

        {!isLoading && pendingCount > 0 && (
          <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-5 text-amber-800">
            Bạn có {pendingCount} giao dịch đang chờ xử lý.
          </div>
        )}

        {isLoading ? (
          <TransactionHistorySkeleton />
        ) : orders.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 text-gray-400">
              <FontAwesomeIcon
                icon={faClockRotateLeft}
                className="text-[2.6rem]"
              />
            </div>
            <h2 className="mt-5 text-[2rem] font-medium text-gray-900">
              Chưa có giao dịch
            </h2>
            <p className="mt-2 text-gray-500">
              Các giao dịch thanh toán của bạn sẽ xuất hiện tại đây.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const status = statusMeta[order.status];
              const isAwaitingReview =
                order.status === "pending" &&
                Boolean(order.transferSubmittedAt);

              return (
                <article
                  key={order.id}
                  className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
                >
                  <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-3">
                        <FontAwesomeIcon
                          icon={faReceipt}
                          className="text-amber-500"
                        />
                        <h2 className="font-semibold text-gray-900">
                          {order.planName || typeLabels[order.orderType]}
                        </h2>
                      </div>
                      <p className="mt-2 text-[1.3rem] text-gray-500">
                        Mã giao dịch:{" "}
                        <span className="font-medium text-gray-700">
                          {order.code}
                        </span>
                      </p>
                      <p className="mt-1 text-[1.3rem] text-gray-500">
                        {methodLabels[order.method]} ·{" "}
                        {formatDate(order.createdAt)}
                      </p>
                      {order.post && (
                        <Link
                          to={`/posts/${order.post.slug}`}
                          className="mt-2 block truncate text-[1.3rem] text-amber-600 hover:text-amber-700"
                        >
                          {order.post.title}
                        </Link>
                      )}
                    </div>
                    <div className="flex flex-col items-start gap-2 md:items-end">
                      <span
                        className={`rounded-full px-5 py-3 text-[1.4rem] font-medium ${status.className}`}
                      >
                        {isAwaitingReview
                          ? "Chờ xác nhận biên lai"
                          : status.label}
                      </span>
                      <span className="text-[2rem] font-medium text-gray-900">
                        {Number(order.amount).toLocaleString("vi-VN")}đ
                      </span>
                    </div>
                  </div>

                  {order.rejectedReason && (
                    <div className="mt-5 rounded-xl bg-red-50 p-4 text-[1.3rem] text-red-700">
                      Lý do từ chối: {order.rejectedReason}
                    </div>
                  )}
                  {order.receiptUrl && (
                    <a
                      href={order.receiptUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-4 inline-flex text-[1.4rem] font-medium text-amber-600 hover:text-amber-700"
                    >
                      Xem biên lai đã gửi
                    </a>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
