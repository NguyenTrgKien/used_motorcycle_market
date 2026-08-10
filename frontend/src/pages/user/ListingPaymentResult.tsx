import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axiosInstance from "../../configs/axiosInstance";
import MonetizationOffers from "./Post/components/MonetizationOffers";

function ListingPaymentResult() {
  const [status, setStatus] = useState("pending");
  const [postId, setPostId] = useState<number | null>(null);

  useEffect(() => {
    const orderId = sessionStorage.getItem("pendingListingPaymentOrderId");
    if (!orderId) {
      setStatus("unknown");
      return;
    }

    let attempts = 0;
    const checkStatus = async () => {
      try {
        const response = await axiosInstance.get(
          `/api/v1/listing-payments/orders/${orderId}`,
        );
        const nextStatus = response.data.data.status as string;
        setPostId(response.data.data.postId || null);
        setStatus(nextStatus);
        if (nextStatus === "paid") {
          sessionStorage.removeItem("pendingListingPaymentOrderId");
          return;
        }
      } finally {
        attempts += 1;
        if (attempts < 10) window.setTimeout(checkStatus, 1500);
      }
    };

    void checkStatus();
  }, []);

  const isPaid = status === "paid";

  return (
    <main className="mx-auto flex min-h-[50rem] max-w-[64rem] items-center px-6 py-12">
      <div className="w-full rounded-2xl border border-gray-200 bg-white p-10 text-center">
        <h1 className="text-[2.4rem] font-semibold text-gray-900">
          {isPaid
            ? "Thanh toán thành công"
            : status === "pending"
              ? "Đang xác nhận thanh toán"
              : "Chưa xác nhận được thanh toán"}
        </h1>
        <p className="mt-3 text-gray-500">
          {isPaid
            ? "Tin đăng đã được gửi kiểm duyệt."
            : "Bạn có thể quay lại trang quản lý tin để theo dõi trạng thái."}
        </p>
        <Link
          to="/posts/manage"
          className="mt-7 inline-flex h-[4.8rem] items-center rounded-xl bg-amber-500 px-7 font-medium text-white"
        >
          Quản lý tin đăng
        </Link>
        {isPaid && postId && (
          <div className="mt-8 border-t border-gray-200 pt-7 text-left">
            <h2 className="text-center text-[1.8rem] font-semibold text-gray-900">Giúp tin bán nhanh hơn</h2>
            <MonetizationOffers postId={postId} status="pending" />
          </div>
        )}
      </div>
    </main>
  );
}

export default ListingPaymentResult;
