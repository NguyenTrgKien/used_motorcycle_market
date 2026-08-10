import { useEffect } from "react";

interface Props {
  fullName: string;
  busy: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

function ApproveIdentityConfirmModal({
  fullName,
  busy,
  onClose,
  onConfirm,
}: Props) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [busy, onClose]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="approve-confirm-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onClose();
      }}
    >
      <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-[2.8rem] font-semibold text-green-600">
          ✓
        </div>
        <div className="text-center">
          <h3
            id="approve-confirm-title"
            className="text-[1.8rem] font-semibold text-gray-900"
          >
            Xác nhận phê duyệt
          </h3>
          <p className="mt-3 text-[1.4rem] leading-6 text-gray-600">
            Bạn có chắc chắn muốn phê duyệt hồ sơ xác minh của
            <span className="font-semibold text-gray-900"> {fullName}</span>?
          </p>
        </div>
        <div className="mt-16 flex justify-end gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            className="h-16 rounded-lg border border-gray-300 px-5 font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onConfirm}
            className="h-16 min-w-40 rounded-lg bg-green-600 px-5 font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? "Đang phê duyệt..." : "Xác nhận phê duyệt"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ApproveIdentityConfirmModal;
