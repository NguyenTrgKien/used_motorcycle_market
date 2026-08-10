import { type MouseEvent, useEffect, useState } from "react";
import { toast } from "react-toastify";
import axiosInstance from "../../../configs/axiosInstance";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheck,
  faEllipsisVertical,
  faEye,
  faMagnifyingGlass,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";
import PaymentConfirmationSuccessModal from "./PaymentConfirmationSuccessModal";
import TransactionDetailModal from "./TransactionDetailModal";

interface TransferOrder {
  id: string;
  code: string;
  amount: number;
  method?: "vnpay" | "momo" | "bank_transfer";
  orderType: "listing" | "featured" | "vip" | "boost" | "subscription";
  status: "pending" | "paid" | "failed" | "cancelled" | "rejected" | "expired";
  receiptUrl?: string;
  transferSubmittedAt?: string;
  paidAt?: string;
  createdAt?: string;
  expiresAt?: string;
  rejectedReason?: string;
  rejectedAt?: string;
  rejectionHistory?: Array<{
    reason: string;
    rejectedAt: string;
    rejectedBy: number;
    receiptUrl?: string;
  }>;
  post?: { id: number; title: string; slug: string };
  user?: { id: number; fullName?: string; email: string };
}

const transactionTypes = {
  listing: { label: "Phí đăng tin", className: "bg-blue-50 text-blue-700" },
  boost: { label: "Đẩy tin", className: "bg-amber-50 text-amber-700" },
  featured: { label: "Tin nổi bật", className: "bg-purple-50 text-purple-700" },
  vip: { label: "Tin VIP", className: "bg-red-50 text-red-700" },
  subscription: {
    label: "Gói người bán",
    className: "bg-green-50 text-green-700",
  },
};

function getTransactionType(orderType: TransferOrder["orderType"]) {
  return transactionTypes[orderType] || transactionTypes.listing;
}

const defaultRejectionReasons = [
  "Không tìm thấy giao dịch trong tài khoản ngân hàng",
  "Số tiền chuyển khoản không chính xác",
  "Nội dung chuyển khoản không khớp",
  "Ảnh biên lai bị mờ hoặc không đọc được",
  "Biên lai không hợp lệ hoặc có dấu hiệu chỉnh sửa",
];

function AdminTransactions() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<TransferOrder[]>([]);
  const [activeStatus, setActiveStatus] = useState<
    "all" | "pending" | "paid" | "rejected"
  >("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [confirmOrder, setConfirmOrder] = useState<TransferOrder | null>(null);
  const [rejectOrder, setRejectOrder] = useState<TransferOrder | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [successfulOrder, setSuccessfulOrder] = useState<TransferOrder | null>(
    null,
  );
  const [detailOrder, setDetailOrder] = useState<TransferOrder | null>(null);
  const [actionMenu, setActionMenu] = useState<{
    order: TransferOrder;
    right: number;
    top?: number;
    bottom?: number;
  } | null>(null);

  useEffect(() => {
    if (!actionMenu) return;
    const closeMenu = () => setActionMenu(null);
    window.addEventListener("resize", closeMenu);
    window.addEventListener("scroll", closeMenu, true);
    return () => {
      window.removeEventListener("resize", closeMenu);
      window.removeEventListener("scroll", closeMenu, true);
    };
  }, [actionMenu]);

  const toggleActionMenu = (
    event: MouseEvent<HTMLButtonElement>,
    order: TransferOrder,
  ) => {
    if (actionMenu?.order.id === order.id) {
      setActionMenu(null);
      return;
    }
    const rect = event.currentTarget.getBoundingClientRect();
    const openUpward = window.innerHeight - rect.bottom < 190;
    setActionMenu({
      order,
      right: Math.max(16, window.innerWidth - rect.right),
      ...(openUpward
        ? { bottom: window.innerHeight - rect.top + 8 }
        : { top: rect.bottom + 8 }),
    });
  };

  const loadOrders = async () => {
    try {
      setIsLoading(true);
      const response = await axiosInstance.get(
        "/api/v1/listing-payments/admin/orders",
      );
      const bankOrders = (response.data.data || []).filter(
        (order: { method: string }) => order.method === "bank_transfer",
      );
      setOrders(bankOrders);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Không thể tải giao dịch");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadOrders();
  }, []);

  const confirmTransfer = async () => {
    if (!confirmOrder) return;
    try {
      setIsProcessing(true);
      await axiosInstance.patch(
        `/api/v1/listing-payments/orders/${confirmOrder.id}/confirm-bank-transfer`,
      );
      setSuccessfulOrder(confirmOrder);
      setOrders((orders) =>
        orders.map((order) =>
          order.id === confirmOrder.id ? { ...order, status: "paid" } : order,
        ),
      );
      setConfirmOrder(null);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Không thể xác nhận giao dịch",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const rejectTransfer = async () => {
    if (!rejectOrder || rejectionReason.trim().length < 3) {
      toast.error("Vui lòng nhập lý do từ chối");
      return;
    }
    try {
      setIsProcessing(true);
      const response = await axiosInstance.patch(
        `/api/v1/listing-payments/orders/${rejectOrder.id}/reject-bank-transfer`,
        { reason: rejectionReason.trim() },
      );
      toast.success("Đã từ chối giao dịch");
      setOrders((orders) =>
        orders.map((order) =>
          order.id === rejectOrder.id ? response.data.data : order,
        ),
      );
      setRejectOrder(null);
      setRejectionReason("");
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Không thể từ chối giao dịch",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const visibleOrders = orders.filter((order) => {
    if (activeStatus !== "all" && order.status !== activeStatus) return false;
    if (
      order.status === "pending" &&
      !(order.receiptUrl && order.transferSubmittedAt)
    ) {
      return false;
    }
    const keyword = searchQuery.trim().toLowerCase();
    if (!keyword) return true;
    return [
      order.code,
      order.post?.id,
      order.post?.title,
      getTransactionType(order.orderType).label,
      order.user?.id,
      order.user?.fullName,
      order.user?.email,
    ].some((value) =>
      String(value || "")
        .toLowerCase()
        .includes(keyword),
    );
  });

  const statusTabs = [
    { value: "all" as const, label: "Tất cả" },
    { value: "pending" as const, label: "Chờ xử lý" },
    { value: "paid" as const, label: "Đã xác nhận" },
    { value: "rejected" as const, label: "Bị từ chối" },
  ];

  return (
    <section className="px-5 py-6 md:px-8">
      <div className="space-y-6">
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
          <div className="border-b border-gray-200 p-6">
            <div className="flex flex-wrap gap-2">
              {statusTabs.map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setActiveStatus(tab.value)}
                  className={`h-[4.4rem] rounded-lg px-5 font-medium transition-colors ${
                    activeStatus === tab.value
                      ? "bg-[#111827] text-white shadow-sm"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="relative mt-4">
              <FontAwesomeIcon
                icon={faMagnifyingGlass}
                className="absolute left-5 top-1/2 -translate-y-1/2 text-[1.8rem] text-gray-400"
              />
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Tìm theo mã giao dịch, tin đăng, người đăng hoặc email"
                className="h-18 w-full rounded-lg border border-gray-300 bg-white pl-14 pr-5 text-[1.6rem] text-gray-800 outline-none transition-colors placeholder:text-gray-400 focus:border-gray-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-between border-b border-gray-200 p-6">
            <h2 className="text-[1.8rem] font-semibold">
              {statusTabs.find((tab) => tab.value === activeStatus)?.label}
            </h2>
            <button
              type="button"
              onClick={() => void loadOrders()}
              className="rounded-xl border border-gray-300 px-5 py-3"
            >
              Tải lại
            </button>
          </div>
          {isLoading ? (
            <div className="p-10 text-center text-gray-500">Đang tải...</div>
          ) : visibleOrders.length === 0 ? (
            <div className="p-10 text-center text-gray-500">
              Không có giao dịch phù hợp
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-[1.3rem] text-gray-500">
                  <tr>
                    <th className="p-4">Mã</th>
                    <th className="p-4">Người đăng</th>
                    <th className="p-4">Tin đăng</th>
                    <th className="p-4">Loại giao dịch</th>
                    <th className="p-4">Số tiền</th>
                    <th className="p-4">Biên lai</th>
                    <th className="p-4 text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {visibleOrders.map((order) => (
                    <tr key={order.id}>
                      <td className="p-4 font-medium">{order.code}</td>
                      <td className="p-4">
                        <p>{order.user?.fullName || "Người dùng"}</p>
                        <p className="text-[1.2rem] text-gray-400">
                          {order.user?.email}
                        </p>
                      </td>
                      <td className="max-w-[28rem] p-4">
                        {order.post?.slug ? (
                          <button
                            type="button"
                            title={order.post.title}
                            onClick={() =>
                              navigate(`/admin/posts/view/${order.post?.slug}`)
                            }
                            className="block max-w-full truncate text-left font-medium text-blue-600 transition-colors hover:text-blue-800 hover:underline"
                          >
                            {order.post.title}
                          </button>
                        ) : (
                          <span className="text-gray-400">
                            Tin không tồn tại
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-flex whitespace-nowrap rounded-full px-6 py-3 text-[1.4rem] font-medium ${getTransactionType(order.orderType).className}`}
                        >
                          {getTransactionType(order.orderType).label}
                        </span>
                      </td>
                      <td className="p-4 font-medium">
                        {Number(order.amount).toLocaleString("vi-VN")}đ
                      </td>
                      <td className="p-4">
                        {order.receiptUrl ? (
                          <a
                            href={order.receiptUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <img
                              src={order.receiptUrl}
                              alt={`Biên lai ${order.code}`}
                              className="h-16 w-16 rounded-lg border object-cover"
                            />
                          </a>
                        ) : (
                          <span className="text-gray-400">Chưa gửi</span>
                        )}
                      </td>
                      <td className="w-[9rem] p-4 text-center">
                        <button
                          type="button"
                          aria-label={`Mở thao tác cho giao dịch ${order.code}`}
                          aria-expanded={actionMenu?.order.id === order.id}
                          onClick={(event) => toggleActionMenu(event, order)}
                          className={`inline-flex h-16 w-16 items-center justify-center rounded-xl border transition-colors ${
                            actionMenu?.order.id === order.id
                              ? "border-gray-800 bg-gray-800 text-white"
                              : "border-gray-300 bg-white text-gray-600 hover:border-gray-400 hover:bg-gray-50"
                          }`}
                        >
                          <FontAwesomeIcon
                            icon={faEllipsisVertical}
                            className="text-[1.8rem]"
                          />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {actionMenu && (
        <>
          <button
            type="button"
            aria-label="Đóng menu thao tác"
            onClick={() => setActionMenu(null)}
            className="fixed inset-0 z-[900] cursor-default"
          />
          <div
            role="menu"
            className="fixed z-[901] w-[20rem] overflow-hidden rounded-xl border border-gray-200 bg-white p-2 shadow-xl"
            style={{
              right: actionMenu.right,
              top: actionMenu.top,
              bottom: actionMenu.bottom,
            }}
          >
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setDetailOrder(actionMenu.order);
                setActionMenu(null);
              }}
              className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-gray-700 transition-colors hover:bg-gray-100"
            >
              <FontAwesomeIcon icon={faEye} className="w-7 text-gray-400" />
              <span>Chi tiết</span>
            </button>
            {actionMenu.order.status === "pending" && (
              <>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setRejectOrder(actionMenu.order);
                    setActionMenu(null);
                  }}
                  className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-red-600 transition-colors hover:bg-red-50"
                >
                  <FontAwesomeIcon icon={faXmark} className="w-7" />
                  <span>Từ chối</span>
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setConfirmOrder(actionMenu.order);
                    setActionMenu(null);
                  }}
                  className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-green-600 transition-colors hover:bg-green-50"
                >
                  <FontAwesomeIcon icon={faCheck} className="w-7" />
                  <span>Xác nhận</span>
                </button>
              </>
            )}
          </div>
        </>
      )}

      {confirmOrder && (
        <DecisionModal
          title="Xác nhận giao dịch"
          order={confirmOrder}
          isProcessing={isProcessing}
          onClose={() => setConfirmOrder(null)}
          onSubmit={() => void confirmTransfer()}
          submitLabel="Xác nhận đã nhận tiền"
        />
      )}

      {detailOrder && (
        <TransactionDetailModal
          order={detailOrder}
          typeLabel={getTransactionType(detailOrder.orderType).label}
          onClose={() => setDetailOrder(null)}
          onViewPost={
            detailOrder.post?.slug
              ? () => navigate(`/admin/posts/view/${detailOrder.post?.slug}`)
              : undefined
          }
        />
      )}

      {successfulOrder && (
        <PaymentConfirmationSuccessModal
          orderCode={successfulOrder.code}
          postTitle={successfulOrder.post?.title}
          isSubscription={successfulOrder.orderType === "subscription"}
          canViewPost={Boolean(
            successfulOrder.orderType !== "subscription" &&
            successfulOrder.post?.slug,
          )}
          onClose={() => setSuccessfulOrder(null)}
          onViewPost={() => {
            const slug = successfulOrder.post?.slug;
            if (!slug) return;
            setSuccessfulOrder(null);
            navigate(`/admin/posts/pending/${slug}`);
          }}
        />
      )}

      {rejectOrder && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 p-5">
          <div className="w-full max-w-[46rem] rounded-2xl bg-white p-7 shadow-2xl">
            <h3 className="text-[2rem] font-semibold">Từ chối giao dịch</h3>
            <p className="mt-2 text-gray-500">
              {rejectOrder.code} ·{" "}
              {Number(rejectOrder.amount).toLocaleString("vi-VN")}đ
            </p>
            <div className="mt-5">
              <p className="font-medium text-gray-800">Chọn lý do nhanh</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {defaultRejectionReasons.map((reason) => (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => setRejectionReason(reason)}
                    className={`rounded-lg border px-3 py-2 text-left text-[1.3rem] transition-colors ${
                      rejectionReason === reason
                        ? "border-red-500 bg-red-50 text-red-700"
                        : "border-gray-300 text-gray-600 hover:border-red-300"
                    }`}
                  >
                    {reason}
                  </button>
                ))}
              </div>
            </div>
            <textarea
              value={rejectionReason}
              onChange={(event) => setRejectionReason(event.target.value)}
              maxLength={500}
              rows={4}
              autoFocus
              placeholder="Nhập lý do từ chối..."
              className="mt-5 w-full resize-none rounded-xl border border-gray-300 p-4 outline-none focus:border-red-500"
            />
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setRejectOrder(null);
                  setRejectionReason("");
                }}
                disabled={isProcessing}
                className="h-18 flex-1 rounded-xl border border-gray-300"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => void rejectTransfer()}
                disabled={isProcessing || rejectionReason.trim().length < 3}
                className="h-18 flex-1 rounded-xl bg-red-600 font-medium text-white disabled:bg-gray-300"
              >
                {isProcessing ? "Đang xử lý..." : "Xác nhận từ chối"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

interface DecisionModalProps {
  title: string;
  order: TransferOrder;
  isProcessing: boolean;
  onClose: () => void;
  onSubmit: () => void;
  submitLabel: string;
}

function DecisionModal({
  title,
  order,
  isProcessing,
  onClose,
  onSubmit,
  submitLabel,
}: DecisionModalProps) {
  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 p-5">
      <div className="w-full max-w-[46rem] rounded-2xl bg-white p-7 shadow-2xl">
        <h3 className="text-[2rem] font-semibold">{title}</h3>
        <div className="mt-5 space-y-3 rounded-xl bg-gray-50 p-5">
          <p className="flex justify-between gap-4">
            <span className="text-gray-500">Mã giao dịch</span>
            <span className="font-semibold">{order.code}</span>
          </p>
          <p className="flex justify-between gap-4">
            <span className="text-gray-500">Loại giao dịch</span>
            <span
              className={`rounded-full px-3 py-1 text-[1.2rem] font-medium ${getTransactionType(order.orderType).className}`}
            >
              {getTransactionType(order.orderType).label}
            </span>
          </p>
          <p className="flex justify-between gap-4">
            <span className="text-gray-500">Số tiền</span>
            <span className="font-semibold text-green-600">
              {Number(order.amount).toLocaleString("vi-VN")}đ
            </span>
          </p>
        </div>
        {order.receiptUrl && (
          <a href={order.receiptUrl} target="_blank" rel="noreferrer">
            <img
              src={order.receiptUrl}
              alt={`Biên lai ${order.code}`}
              className="mt-5 max-h-[28rem] w-full rounded-xl border object-contain"
            />
          </a>
        )}
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="h-18 flex-1 rounded-xl border border-gray-300"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={isProcessing}
            className="h-18 flex-1 rounded-xl bg-green-500 hover:bg-green-600 transition-colors font-medium text-white disabled:bg-gray-300"
          >
            {isProcessing ? "Đang xử lý..." : submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AdminTransactions;
