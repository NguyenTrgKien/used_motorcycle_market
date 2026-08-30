import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { toast } from "react-toastify";
import axiosInstance from "../../configs/axiosInstance";
import BankTransferQrModal, {
  type BankTransferDetails,
} from "./Post/components/BankTransferQrModal";
import type { ListingPost } from "./Post/post.types";

const methods = [
  { value: "vnpay", label: "VNPay" },
  { value: "momo", label: "MoMo" },
  { value: "bank_transfer", label: "Chuyển khoản ngân hàng" },
] as const;

export default function ListingPayment() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const postId = Number(searchParams.get("postId")) || undefined;
  const pricingPlanId = Number(searchParams.get("pricingPlanId")) || undefined;
  const subscriptionPlanId =
    Number(searchParams.get("subscriptionPlanId")) || undefined;
  const amount = Number(searchParams.get("amount")) || 0;
  const orderType = searchParams.get("orderType") || "listing";
  const planName = searchParams.get("planName");
  const durationDays = Number(searchParams.get("durationDays")) || undefined;
  const expectedStartDate = searchParams.get("expectedStartDate");
  const initialMethod = searchParams.get("method");
  const [method, setMethod] = useState<"vnpay" | "momo" | "bank_transfer">(
    initialMethod === "bank_transfer" || initialMethod === "momo"
      ? initialMethod
      : "vnpay",
  );
  const [post, setPost] = useState<ListingPost | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [bankTransfer, setBankTransfer] = useState<BankTransferDetails | null>(
    null,
  );

  useEffect(() => {
    if (!postId) return;
    axiosInstance
      .get<{ data: ListingPost[] }>("/api/v1/posts/my")
      .then((response) => {
        setPost(
          (response.data.data || []).find((item) => item.id === postId) || null,
        );
      })
      .catch(() => setPost(null));
  }, [postId]);

  const handlePayment = async () => {
    try {
      setIsCreating(true);
      const response = await axiosInstance.post(
        "/api/v1/listing-payments/orders",
        {
          ...(postId ? { postId } : {}),
          orderType,
          ...(pricingPlanId ? { pricingPlanId } : {}),
          ...(subscriptionPlanId ? { subscriptionPlanId } : {}),
          method,
        },
      );
      const orderId = response.data.data.id as string;
      sessionStorage.setItem("pendingListingPaymentOrderId", orderId);
      if (response.data.paymentUrl) {
        window.location.assign(response.data.paymentUrl);
        return;
      }
      if (response.data.bankTransfer)
        setBankTransfer({ ...response.data.bankTransfer, orderId });
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Không thể tạo yêu cầu thanh toán",
      );
    } finally {
      setIsCreating(false);
    }
  };

  const image =
    post?.post_images?.find((item) => item.isPrimary)?.imageUrl ||
    post?.post_images?.[0]?.imageUrl;
  const paymentPurpose =
    orderType === "boost"
      ? "Dịch vụ đẩy tin"
      : orderType === "featured"
        ? "Dịch vụ tin nổi bật"
        : orderType === "vip"
          ? "Dịch vụ tin VIP"
          : orderType === "subscription"
            ? "Gói dành cho người bán"
            : "Phí đăng tin";

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10">
      <section className="mx-auto max-w-[90rem] rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-3 text-gray-600 hover:cursor-pointer hover:text-gray-900"
        >
          <FontAwesomeIcon icon={faArrowLeft} /> Quay lại
        </button>
        <h1 className="mt-7 text-[2.6rem] font-semibold text-gray-900">
          Thanh toán
        </h1>
        {post && (
          <div className="mt-6 flex items-center gap-5 rounded-2xl border border-gray-200 bg-gray-50 p-5">
            <div className="h-[9rem] w-[13rem] shrink-0 overflow-hidden rounded-xl bg-white">
              {image ? (
                <img
                  src={image}
                  alt={post.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-gray-400">
                  Không có ảnh
                </div>
              )}
            </div>
            <div className="min-w-0">
              <h2 className="truncate font-medium text-gray-900">
                {post.title}
              </h2>
              <p className="mt-2 font-semibold text-amber-600">
                {Number(post.price).toLocaleString("vi-VN")}đ
              </p>
            </div>
          </div>
        )}
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-5">
          <p className="text-[1.4rem] text-gray-600">Nội dung thanh toán</p>
          <p className="mt-1 font-semibold text-gray-900">{paymentPurpose}</p>
          {planName && <p className="mt-2 text-gray-700">Gói: {planName}</p>}
          {orderType === "boost" && (
            <div className="mt-2 text-[1.4rem] text-gray-600">
              {durationDays && <p>Thời gian đẩy tin: {durationDays} ngày</p>}
              {expectedStartDate && <p>Dự kiến bắt đầu: {expectedStartDate}</p>}
              <p>Tin được đẩy lên trang đầu sau khi thanh toán thành công</p>
            </div>
          )}
        </div>
        <div className="mt-6 rounded-xl bg-green-50 p-5">
          <p className="text-gray-600">Số tiền thanh toán</p>
          <p className="mt-1 text-[2.4rem] font-semibold text-green-600">
            {amount.toLocaleString("vi-VN")}đ
          </p>
        </div>
        <h2 className="mt-7 font-medium text-gray-900">
          Phương thức thanh toán
        </h2>
        <div className="mt-4 space-y-3">
          {methods.map((item) => (
            <label
              key={item.value}
              className={`flex cursor-pointer items-center gap-4 rounded-xl border p-5 ${method === item.value ? "border-amber-500 bg-amber-50" : "border-gray-200"}`}
            >
              <input
                type="radio"
                name="listingPaymentMethod"
                value={item.value}
                checked={method === item.value}
                onChange={() => setMethod(item.value)}
              />
              <span className="font-medium text-gray-800">{item.label}</span>
            </label>
          ))}
        </div>
        <button
          type="button"
          onClick={() => void handlePayment()}
          disabled={isCreating}
          className="mt-7 h-[5rem] w-full rounded-xl bg-amber-500 font-medium text-white hover:bg-amber-600 disabled:bg-gray-300"
        >
          {isCreating ? "Đang tạo..." : "Thanh toán"}
        </button>
      </section>
      {bankTransfer && (
        <BankTransferQrModal
          details={bankTransfer}
          onClose={() => setBankTransfer(null)}
          onSubmitted={() => navigate("/transactions")}
        />
      )}
    </main>
  );
}
