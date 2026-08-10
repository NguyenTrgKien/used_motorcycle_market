const defaultBanReasons = [
  "Tài khoản có dấu hiệu lừa đảo hoặc giả mạo",
  "Đăng tin sai sự thật hoặc gây hiểu nhầm",
  "Spam tin nhắn, bình luận hoặc nội dung quảng cáo",
  "Vi phạm chính sách cộng đồng nhiều lần",
  "Có hành vi quấy rối hoặc xúc phạm người dùng khác",
];

interface BanUserModalProps {
  userName: string;
  reason: string;
  isSubmitting: boolean;
  onReasonChange: (reason: string) => void;
  onClose: () => void;
  onConfirm: () => void;
}

function BanUserModal({
  userName,
  reason,
  isSubmitting,
  onReasonChange,
  onClose,
  onConfirm,
}: BanUserModalProps) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4"
      onMouseDown={() => !isSubmitting && onClose()}
    >
      <div
        className="w-full max-w-[44rem] rounded-lg bg-white p-6 shadow-xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <h2 className="text-[2rem] font-semibold">Khóa người dùng</h2>
        <p className="mt-2 text-[1.4rem] text-gray-500">{userName}</p>
        <div className="mt-5 rounded-lg border border-gray-300 p-4">
          <div className="flex flex-wrap gap-2">
            {defaultBanReasons.map((item) => (
              <button
                key={item}
                type="button"
                disabled={isSubmitting}
                onClick={() => onReasonChange(item)}
                className={`rounded-full border px-5 py-3 text-start text-[1.4rem] transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                  reason === item
                    ? "border-red-300 bg-red-50 text-red-600"
                    : "border-gray-300 bg-white text-gray-600 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
        <label className="mt-5 block">
          <span className="text-[1.3rem] font-semibold text-gray-600">
            Lý do khóa
          </span>
          <textarea
            value={reason}
            onChange={(event) => onReasonChange(event.target.value)}
            rows={4}
            maxLength={500}
            className="mt-2 w-full resize-none rounded-lg border border-gray-300 p-4 outline-none focus:border-amber-400"
            placeholder="Nhập lý do khóa tài khoản"
          />
        </label>
        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            className="h-18 rounded-lg border border-gray-300 px-5 font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-60"
          >
            Hủy
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onConfirm}
            className="h-18 rounded-lg bg-red-600 px-5 font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Đang xử lý..." : "Xác nhận khóa"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default BanUserModal;
