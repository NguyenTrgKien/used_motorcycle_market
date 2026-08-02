import { faClose } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect } from "react";

interface ReceiptPreviewModalProps {
  imageUrl: string;
  onClose: () => void;
}

function ReceiptPreviewModal({ imageUrl, onClose }: ReceiptPreviewModalProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/70 p-5"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="receipt-preview-title"
        className="flex max-h-[92vh] w-full max-w-[90rem] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <h3 id="receipt-preview-title" className="text-[1.8rem] font-semibold text-gray-900">
            Biên lai giao dịch
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng ảnh biên lai"
            className="flex h-11 w-11 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100"
          >
            <FontAwesomeIcon icon={faClose} />
          </button>
        </div>
        <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto bg-gray-100 p-4">
          <img
            src={imageUrl}
            alt="Biên lai giao dịch"
            className="max-h-[78vh] max-w-full object-contain"
          />
        </div>
      </div>
    </div>
  );
}

export default ReceiptPreviewModal;
