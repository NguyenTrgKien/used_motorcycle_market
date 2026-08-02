import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import axiosInstance from "../../../../configs/axiosInstance";

export interface BankTransferDetails {
  orderId: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  amount: number;
  content: string;
  qrImageUrl: string;
  expiresAt: string;
}

interface BankTransferQrModalProps {
  details: BankTransferDetails;
  onClose: () => void;
  onSubmitted?: () => void;
}

function BankTransferQrModal({
  details,
  onClose,
  onSubmitted,
}: BankTransferQrModalProps) {
  const [receipt, setReceipt] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isQrLoading, setIsQrLoading] = useState(true);
  const [hasQrError, setHasQrError] = useState(false);

  useEffect(() => {
    setIsQrLoading(true);
    setHasQrError(false);
  }, [details.qrImageUrl]);

  const handleSubmit = async () => {
    if (!receipt) {
      toast.error("Vui lòng chọn ảnh biên lai giao dịch");
      return;
    }
    if (receipt.size > 5 * 1024 * 1024) {
      toast.error("Ảnh biên lai không được vượt quá 5MB");
      return;
    }

    try {
      setIsSubmitting(true);
      const formData = new FormData();
      formData.append("receipt", receipt);
      const response = await axiosInstance.patch(
        `/api/v1/listing-payments/orders/${details.orderId}/submit-bank-transfer`,
        formData,
      );
      toast.success(
        response.data.message || "Đã gửi biên lai, giao dịch đang chờ xác nhận",
      );
      onSubmitted?.();
      onClose();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Không thể gửi biên lai giao dịch",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 p-6">
      <div className="max-h-[92vh] w-full max-w-[48rem] overflow-y-auto rounded-2xl bg-white p-8 shadow-2xl">
        <h2 className="text-center text-[2.2rem] font-semibold text-gray-900">
          Quét mã VietQR
        </h2>
        <p className="mt-2 text-center text-gray-500">
          Mở ứng dụng ngân hàng và quét mã để chuyển khoản
        </p>

        <div className="mt-5 flex min-h-[25rem] items-center justify-center rounded-2xl border border-gray-200 bg-white p-3">
          {isQrLoading && (
            <div
              aria-label="Đang tải mã VietQR"
              className="aspect-square w-full max-w-[25rem] animate-pulse rounded-xl bg-gray-200"
            />
          )}
          {hasQrError ? (
            <div className="flex min-h-[22rem] items-center justify-center px-5 text-center text-[1.3rem] text-red-500">
              Không thể tải mã VietQR. Vui lòng thử mở lại phương thức thanh toán.
            </div>
          ) : (
            <img
              src={details.qrImageUrl}
              alt="VietQR chuyển khoản ngân hàng"
              onLoad={() => setIsQrLoading(false)}
              onError={() => {
                setIsQrLoading(false);
                setHasQrError(true);
              }}
              className={`${isQrLoading ? "hidden" : "block"} h-auto w-full max-w-[25rem]`}
            />
          )}
        </div>

        <p className="mt-4 text-center text-[1.3rem] text-gray-500">
          Tin sẽ được gửi kiểm duyệt sau khi quản trị viên xác nhận giao dịch.
        </p>

        <label className="mt-5 block cursor-pointer rounded-xl border border-dashed border-gray-300 bg-gray-50 p-2 text-center transition-colors hover:border-amber-500">
          <span className="block text-gray-800 line-clamp-1 mx-20">
            {receipt ? receipt.name : "Chọn ảnh biên lai giao dịch"}
          </span>
          <span className="mt-1 block text-[1.2rem] text-gray-500">
            JPG, PNG hoặc WEBP, tối đa 5MB
          </span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(event) => setReceipt(event.target.files?.[0] || null)}
          />
        </label>

        <div className="mt-6 flex gap-4">
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={!receipt || isSubmitting}
            className="h-[4.8rem] flex-1 rounded-xl bg-green-600 font-medium text-white disabled:bg-gray-300"
          >
            {isSubmitting ? "Đang gửi..." : "Xác nhận đã chuyển khoản"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default BankTransferQrModal;
