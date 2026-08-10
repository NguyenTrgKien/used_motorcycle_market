import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import axiosInstance from "../../../configs/axiosInstance";

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

function AdminRevenue() {
  const [orders, setOrders] = useState<PaidOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadRevenue = async () => {
    try {
      setIsLoading(true);
      const response = await axiosInstance.get(
        "/api/v1/listing-payments/admin/orders",
      );
      setOrders(
        (response.data.data || []).filter(
          (order: { status: string }) => order.status === "paid",
        ),
      );
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

  const totalRevenue = useMemo(
    () => orders.reduce((total, order) => total + Number(order.amount), 0),
    [orders],
  );
  const revenueByType = useMemo(() => orders.reduce<Record<string, number>>((result, order) => {
    const type = order.orderType || "listing";
    result[type] = (result[type] || 0) + Number(order.amount);
    return result;
  }, {}), [orders]);

  return (
    <section className="px-5 py-6 md:px-8">
      <div className="space-y-6">
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <p className="text-gray-500">Tổng doanh thu đăng tin</p>
            <p className="mt-2 text-[2.6rem] font-semibold text-gray-900">
              {totalRevenue.toLocaleString("vi-VN")}đ
            </p>
          </div>
          {Object.entries(revenueByType).map(([type, amount]) => (
            <div key={type} className="rounded-2xl border border-gray-200 bg-white p-6">
              <p className="text-gray-500">{type}</p>
              <p className="mt-2 text-[2.2rem] font-semibold text-amber-600">{amount.toLocaleString("vi-VN")}đ</p>
            </div>
          ))}
          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <p className="text-gray-500">Giao dịch thành công</p>
            <p className="mt-2 text-[2.6rem] font-semibold text-green-600">
              {orders.length}
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
          <div className="flex items-center justify-between border-b border-gray-200 p-6">
            <h2 className="text-[1.8rem] font-semibold text-gray-900">
              Lịch sử doanh thu
            </h2>
            <button
              type="button"
              onClick={() => void loadRevenue()}
              className="rounded-xl border border-gray-300 px-5 py-3"
            >
              Tải lại
            </button>
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
                  {orders.map((order) => (
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
