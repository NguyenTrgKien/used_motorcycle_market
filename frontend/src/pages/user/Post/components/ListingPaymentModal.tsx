import { useState } from "react";
import axiosInstance from "../../../../configs/axiosInstance";
import { toast } from "react-toastify";
import BankTransferQrModal, {
  type BankTransferDetails,
} from "./BankTransferQrModal";

interface ListingPaymentModalProps {
  postId: number;
  amount: number;
  onClose: () => void;
  onPaymentSubmitted?: () => void;
  initialMethod?: "vnpay" | "momo" | "bank_transfer";
}

const methods = [
  { value: "vnpay", label: "VNPay" },
  { value: "momo", label: "Ví MoMo" },
  { value: "bank_transfer", label: "Chuyển khoản ngân hàng" },
];

function ListingPaymentModal({
  postId,
  amount,
  onClose,
  onPaymentSubmitted,
  initialMethod = "vnpay",
}: ListingPaymentModalProps) {
  const [method, setMethod] = useState(initialMethod);
  const [isCreating, setIsCreating] = useState(false);
  const [bankTransfer, setBankTransfer] = useState<BankTransferDetails | null>(
    null,
  );

  const handlePayment = async () => {
    try {
      setIsCreating(true);
      const response = await axiosInstance.post(
        "/api/v1/listing-payments/orders",
        {
          postId,
          method,
        },
      );
      const orderId = response.data.data.id as string;
      sessionStorage.setItem("pendingListingPaymentOrderId", orderId);

      if (response.data.paymentUrl) {
        window.location.assign(response.data.paymentUrl);
        return;
      }

      if (response.data.bankTransfer) {
        setBankTransfer({
          ...response.data.bankTransfer,
          orderId,
        });
      }
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Không thể tạo yêu cầu thanh toán",
      );
    } finally {
      setIsCreating(false);
    }
  };

  if (bankTransfer) {
    return (
      <BankTransferQrModal
        details={bankTransfer}
        onClose={onClose}
        onSubmitted={onPaymentSubmitted}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 p-6">
      <div className="w-full max-w-[52rem] rounded-2xl bg-white p-8 shadow-2xl">
        <h2 className="text-[2.2rem] font-semibold text-gray-900">
          Thanh toán phí đăng tin
        </h2>
        <p className="mt-2 text-gray-500">
          Tin đã được lưu. Sau khi thanh toán thành công, tin sẽ được gửi kiểm
          duyệt.
        </p>
        <div className="mt-6 rounded-xl bg-green-50 p-5">
          <p className="text-gray-600">Số tiền thanh toán</p>
          <p className="mt-1 text-[2.4rem] font-semibold text-green-500">
            {amount.toLocaleString("vi-VN")}đ
          </p>
        </div>

        <div className="mt-6 space-y-3">
          {methods.map((item) => (
            <label
              key={item.value}
              className={`flex cursor-pointer items-center gap-4 rounded-xl border p-5 ${
                method === item.value
                  ? "border-amber-500 bg-amber-50"
                  : "border-gray-200"
              }`}
            >
              <input
                type="radio"
                name="listingPaymentMethod"
                value={item.value}
                checked={method === item.value}
                onChange={(event) =>
                  setMethod(
                    event.target.value as "vnpay" | "momo" | "bank_transfer",
                  )
                }
              />
              <span className="font-medium text-gray-800">{item.label}</span>
            </label>
          ))}
        </div>

        <div className="mt-7 flex gap-4">
          <button
            type="button"
            onClick={onClose}
            className="h-[4.8rem] flex-1 rounded-xl border border-gray-300 text-gray-700"
          >
            Thanh toán sau
          </button>
          <button
            type="button"
            onClick={() => void handlePayment()}
            disabled={isCreating}
            className="h-[4.8rem] flex-1 rounded-xl bg-amber-500 font-medium text-white disabled:bg-gray-300"
          >
            {isCreating ? "Đang tạo..." : "Tiếp tục thanh toán"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ListingPaymentModal;
