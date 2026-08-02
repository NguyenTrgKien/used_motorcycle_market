import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleCheck,
  faExternalLink,
} from "@fortawesome/free-solid-svg-icons";

interface PaymentConfirmationSuccessModalProps {
  orderCode: string;
  postTitle?: string;
  canViewPost: boolean;
  onClose: () => void;
  onViewPost: () => void;
}

function PaymentConfirmationSuccessModal({
  orderCode,
  postTitle,
  canViewPost,
  onClose,
  onViewPost,
}: PaymentConfirmationSuccessModalProps) {
  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/50 p-5">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="payment-confirmation-success-title"
        className="w-full max-w-[46rem] rounded-2xl bg-white p-7 text-center shadow-2xl"
      >
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-[4rem] text-emerald-600">
          <FontAwesomeIcon icon={faCircleCheck} />
        </div>
        <h3
          id="payment-confirmation-success-title"
          className="mt-5 text-[2.2rem] font-semibold text-gray-900"
        >
          Xác nhận thanh toán thành công
        </h3>
        <p className="mt-2 text-[1.4rem] leading-6 text-gray-600">
          Giao dịch{" "}
          <span className="font-semibold text-gray-900">{orderCode}</span> đã
          được xác nhận. Tin đăng đã chuyển sang trạng thái chờ duyệt.
        </p>
        {postTitle && (
          <div className="mt-5 rounded-xl bg-gray-50 px-4 py-3 text-left">
            <p className="text-[1.2rem] font-medium uppercase text-gray-500">
              Tin đăng
            </p>
            <p className="mt-1 line-clamp-2 text-[1.4rem] font-medium text-gray-900">
              {postTitle}
            </p>
          </div>
        )}
        <div className="mt-7 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-gray-300 px-5 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Đóng
          </button>
          {canViewPost && (
            <button
              type="button"
              onClick={onViewPost}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 font-medium text-white transition-colors hover:bg-emerald-700"
            >
              <FontAwesomeIcon icon={faExternalLink} />
              Xem tin đăng
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default PaymentConfirmationSuccessModal;
