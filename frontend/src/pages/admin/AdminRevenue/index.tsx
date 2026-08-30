import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import axiosInstance from "../../../configs/axiosInstance";
import { useNavigate } from "react-router-dom";
import RevenueTrendChart from "./RevenueTrendChart";

interface PaidOrder {
  id: string;
  code: string;
  amount: number;
  method: "vnpay" | "momo" | "bank_transfer";
  paidAt?: string;
  orderType: "listing" | "featured" | "vip" | "boost" | "subscription";
  post?: { id: number; title: string };
  user?: { id: number; fullName?: string; email: string };
}

const methodLabels: Record<string, string> = {
  vnpay: "VNPay",
  momo: "MoMo",
  bank_transfer: "Chuyển khoản",
};

interface RevenueSummary {
  totalRevenue: number;
  transactionCount: number;
  averageOrderValue: number;
  todayRevenue: number;
}

const initialSummary: RevenueSummary = {
  totalRevenue: 0,
  transactionCount: 0,
  averageOrderValue: 0,
  todayRevenue: 0,
};

function AdminRevenue() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<PaidOrder[]>([]);
  const [summary, setSummary] = useState<RevenueSummary>(initialSummary);
  const [isLoading, setIsLoading] = useState(true);

  const loadRevenue = async () => {
    try {
      setIsLoading(true);
      const [ordersResponse, summaryResponse] = await Promise.all([
        axiosInstance.get("/api/v1/listing-payments/admin/orders"),
        axiosInstance.get("/api/v1/listing-payments/admin/revenue-summary"),
      ]);
      setOrders(
        (ordersResponse.data.data || []).filter(
          (order: { status: string }) => order.status === "paid",
        ),
      );
      setSummary(summaryResponse.data.data || initialSummary);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Không thể tải dữ liệu doanh thu",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadRevenue();
  }, []);

  return (
    <section className="px-5 py-6 md:px-8">
      <div className="space-y-6">
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <p className="text-gray-500">Tổng doanh thu</p>
            <p className="mt-2 text-[2.6rem] font-semibold text-gray-900">
              {summary.totalRevenue.toLocaleString("vi-VN")}đ
            </p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <p className="text-gray-500">Số giao dịch</p>
            <p className="mt-2 text-[2.6rem] font-semibold text-green-600">
              {summary.transactionCount.toLocaleString("vi-VN")}
            </p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <p className="text-gray-500">Giá trị TB/đơn</p>
            <p className="mt-2 text-[2.6rem] font-semibold text-amber-600">
              {Math.round(summary.averageOrderValue).toLocaleString("vi-VN")}đ
            </p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <p className="text-gray-500">Doanh thu hôm nay</p>
            <p className="mt-2 text-[2.6rem] font-semibold text-blue-600">
              {summary.todayRevenue.toLocaleString("vi-VN")}đ
            </p>
          </div>
        </div>

        <RevenueTrendChart />

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
          <div className="flex items-center justify-between border-b border-gray-200 p-6">
            <h2 className="text-[1.8rem] font-semibold text-gray-900">
              Lịch sử giao dịch
            </h2>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => void loadRevenue()}
                className="rounded-xl border border-gray-300 px-5 py-3"
              >
                Tải lại
              </button>
              <button
                type="button"
                onClick={() => navigate("/admin/transaction-history")}
                className="rounded-xl bg-blue-500 px-5 py-3 font-medium text-white transition-colors hover:bg-gray-700"
              >
                Xem tất cả
              </button>
            </div>
          </div>
          {isLoading ? (
            <div className="p-10 text-center text-gray-500">Đang tải...</div>
          ) : orders.length === 0 ? (
            <div className="p-10 text-center text-gray-500">
              Chưa có giao dịch thành công
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-[1.3rem] text-gray-500">
                  <tr>
                    <th className="p-4">Mã</th>
                    <th className="p-4">Người đăng</th>
                    <th className="p-4">Tin đăng</th>
                    <th className="p-4">Phương thức</th>
                    <th className="p-4">Số tiền</th>
                    <th className="p-4">Ngày thanh toán</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {orders.slice(0, 10).map((order) => (
                    <tr key={order.id}>
                      <td className="p-4 font-medium">{order.code}</td>
                      <td className="p-4">
                        <p>{order.user?.fullName || "Người dùng"}</p>
                        <p className="text-[1.2rem] text-gray-400">
                          {order.user?.email}
                        </p>
                      </td>
                      <td className="max-w-[28rem] truncate p-4">
                        {order.post?.title}
                      </td>
                      <td className="p-4">{methodLabels[order.method]}</td>
                      <td className="p-4 font-medium text-green-600">
                        {Number(order.amount).toLocaleString("vi-VN")}đ
                      </td>
                      <td className="p-4">
                        {order.paidAt
                          ? new Date(order.paidAt).toLocaleString("vi-VN")
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default AdminRevenue;
