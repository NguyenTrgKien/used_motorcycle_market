import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheck,
  faClose,
  faPause,
} from "@fortawesome/free-solid-svg-icons";

interface MonetizationStatusConfirmModalProps {
  isActivating: boolean;
  isProcessing: boolean;
  planName: string;
  onClose: () => void;
  onConfirm: () => void;
}

export default function MonetizationStatusConfirmModal({
  isActivating,
  isProcessing,
  planName,
  onClose,
  onConfirm,
}: MonetizationStatusConfirmModalProps) {
  const title = isActivating ? "Kích hoạt lại gói" : "Ngừng áp dụng gói";
  const description = isActivating
    ? "Gói này sẽ được hiển thị và có thể được người dùng lựa chọn lại."
    : "Gói này sẽ không còn hiển thị cho người dùng mới. Các giao dịch trước đó không bị ảnh hưởng.";

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/50 p-5">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="monetization-status-confirm-title"
        className="w-full max-w-[46rem] rounded-lg bg-white p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2
              id="monetization-status-confirm-title"
              className="text-[2rem] font-semibold text-gray-900"
            >
              {title}
            </h2>
            <p className="mt-2 text-[1.4rem] leading-6 text-gray-600">
              {description}
            </p>
          </div>
          <button
            type="button"
            disabled={isProcessing}
            onClick={onClose}
            aria-label="Đóng"
            className="rounded-lg px-3 py-2 text-gray-500 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <FontAwesomeIcon icon={faClose} />
          </button>
        </div>

        <div className="mt-5 rounded-lg border border-gray-200 bg-gray-50 p-4">
          <p className="text-[1.3rem] text-gray-500">Gói được chọn</p>
          <p className="mt-1 font-semibold text-gray-900">{planName}</p>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            disabled={isProcessing}
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-5 py-3 text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Hủy
          </button>
          <button
            type="button"
            disabled={isProcessing}
            onClick={onConfirm}
            className={`flex items-center justify-center gap-2 rounded-lg px-5 py-3 text-white transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
              isActivating
                ? "bg-emerald-600 hover:bg-emerald-700"
                : "bg-red-600 hover:bg-red-700"
            }`}
          >
            <FontAwesomeIcon icon={isActivating ? faCheck : faPause} />
            {isProcessing
              ? "Đang xử lý..."
              : isActivating
                ? "Xác nhận kích hoạt"
                : "Xác nhận ngừng"}
          </button>
        </div>
      </div>
    </div>
  );
}
