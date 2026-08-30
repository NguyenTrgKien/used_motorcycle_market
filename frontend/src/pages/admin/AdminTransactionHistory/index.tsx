import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import { toast } from "react-toastify";
import axiosInstance from "../../../configs/axiosInstance";

interface TransactionOrder {
  id: string;
  code: string;
  amount: number;
  method?: "vnpay" | "momo" | "bank_transfer";
  orderType: "listing" | "featured" | "vip" | "boost" | "subscription";
  status: "pending" | "paid" | "failed" | "cancelled" | "rejected" | "expired";
  paidAt?: string;
  createdAt?: string;
  post?: { id: number; title: string };
  user?: { id: number; fullName?: string; email: string };
}

const statusLabels: Record<TransactionOrder["status"], string> = {
  pending: "Chờ xử lý",
  paid: "Thành công",
  failed: "Thất bại",
  cancelled: "Đã hủy",
  rejected: "Bị từ chối",
  expired: "Hết hạn",
};

const statusClasses: Record<TransactionOrder["status"], string> = {
  pending: "bg-amber-50 text-amber-700",
  paid: "bg-green-50 text-green-700",
  failed: "bg-red-50 text-red-700",
  cancelled: "bg-gray-100 text-gray-600",
  rejected: "bg-red-50 text-red-700",
  expired: "bg-gray-100 text-gray-600",
};

const methodLabels: Record<string, string> = {
  vnpay: "VNPay",
  momo: "MoMo",
  bank_transfer: "Chuyển khoản",
};

const typeLabels: Record<TransactionOrder["orderType"], string> = {
  listing: "Phí đăng tin",
  featured: "Tin nổi bật",
  vip: "Tin VIP",
  boost: "Đẩy tin",
  subscription: "Gói người bán",
};

function AdminTransactionHistory() {
  const [orders, setOrders] = useState<TransactionOrder[]>([]);
  const [activeStatus, setActiveStatus] = useState<"all" | TransactionOrder["status"]>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const loadOrders = async () => {
    try {
      setIsLoading(true);
      const response = await axiosInstance.get("/api/v1/listing-payments/admin/orders");
      setOrders(response.data.data || []);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Không thể tải lịch sử giao dịch");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadOrders();
  }, []);

  const visibleOrders = orders.filter((order) => {
    if (activeStatus !== "all" && order.status !== activeStatus) return false;
    const keyword = searchQuery.trim().toLowerCase();
    if (!keyword) return true;
    return [order.code, order.post?.title, order.user?.fullName, order.user?.email].some(
      (value) => String(value || "").toLowerCase().includes(keyword),
    );
  });

  const statusTabs = [
    { value: "all" as const, label: "Tất cả" },
    { value: "pending" as const, label: "Chờ xử lý" },
    { value: "paid" as const, label: "Thành công" },
    { value: "failed" as const, label: "Thất bại" },
    { value: "rejected" as const, label: "Bị từ chối" },
    { value: "cancelled" as const, label: "Đã hủy" },
    { value: "expired" as const, label: "Hết hạn" },
  ];

  return (
    <section className="px-5 py-6 md:px-8">
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <div className="border-b border-gray-200 p-6">
          <div className="flex flex-wrap gap-2">
            {statusTabs.map((tab) => (
              <button key={tab.value} type="button" onClick={() => setActiveStatus(tab.value)} className={`h-[4.4rem] rounded-lg px-5 font-medium transition-colors ${activeStatus === tab.value ? "bg-[#111827] text-white shadow-sm" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                {tab.label}
              </button>
            ))}
          </div>
          <div className="relative mt-4">
            <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-5 top-1/2 -translate-y-1/2 text-[1.8rem] text-gray-400" />
            <input type="search" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Tìm theo mã giao dịch, tin đăng, người đăng hoặc email" className="h-18 w-full rounded-lg border border-gray-300 bg-white pl-14 pr-5 text-[1.6rem] text-gray-800 outline-none transition-colors placeholder:text-gray-400 focus:border-gray-500" />
          </div>
        </div>
        <div className="flex items-center justify-between border-b border-gray-200 p-6">
          <h2 className="text-[1.8rem] font-semibold">Lịch sử giao dịch</h2>
          <button type="button" onClick={() => void loadOrders()} className="rounded-xl border border-gray-300 px-5 py-3">Tải lại</button>
        </div>
        {isLoading ? (
          <div className="p-10 text-center text-gray-500">Đang tải...</div>
        ) : visibleOrders.length === 0 ? (
          <div className="p-10 text-center text-gray-500">Không có giao dịch phù hợp</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-[1.3rem] text-gray-500">
                <tr><th className="p-4">Mã</th><th className="p-4">Người dùng</th><th className="p-4">Nội dung</th><th className="p-4">Loại</th><th className="p-4">Phương thức</th><th className="p-4">Số tiền</th><th className="p-4">Trạng thái</th><th className="p-4">Thời gian</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {visibleOrders.map((order) => (
                  <tr key={order.id}>
                    <td className="p-4 font-medium">{order.code}</td>
                    <td className="p-4"><p>{order.user?.fullName || "Người dùng"}</p><p className="text-[1.2rem] text-gray-400">{order.user?.email}</p></td>
                    <td className="max-w-[28rem] truncate p-4">{order.post?.title || "—"}</td>
                    <td className="p-4">{typeLabels[order.orderType] || order.orderType}</td>
                    <td className="p-4">{methodLabels[order.method || ""] || "—"}</td>
                    <td className="whitespace-nowrap p-4 font-medium">{Number(order.amount).toLocaleString("vi-VN")}đ</td>
                    <td className="p-4"><span className={`inline-flex whitespace-nowrap rounded-full px-4 py-2 text-[1.3rem] font-medium ${statusClasses[order.status]}`}>{statusLabels[order.status]}</span></td>
                    <td className="whitespace-nowrap p-4">{order.paidAt || order.createdAt ? new Date(order.paidAt || order.createdAt || "").toLocaleString("vi-VN") : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}

export default AdminTransactionHistory;
