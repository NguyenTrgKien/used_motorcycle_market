import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClose, faRotateLeft } from "@fortawesome/free-solid-svg-icons";
import type { AdminManagedPost } from "../types";

interface RestorePostModalProps {
  isRestoring: boolean;
  post: AdminManagedPost;
  onClose: () => void;
  onConfirm: () => void;
}

function RestorePostModal({
  isRestoring,
  post,
  onClose,
  onConfirm,
}: RestorePostModalProps) {
  return (
    <div className="fixed inset-0 z-999 flex items-center justify-center bg-black/40 px-5">
      <div className="w-full max-w-[48rem] rounded-lg bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-[2rem] font-semibold text-gray-900">
              Khôi phục tin đăng
            </h2>
            <p className="mt-1 text-[1.4rem] text-gray-500">
              Tin đăng sẽ được hiển thị lại công khai sau khi khôi phục.
            </p>
          </div>
          <button
            type="button"
            disabled={isRestoring}
            onClick={onClose}
            className="rounded-lg px-3 py-2 text-gray-500 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <FontAwesomeIcon icon={faClose} />
          </button>
        </div>

        <div className="mt-5 rounded-lg border border-gray-200 p-4">
          <p className="line-clamp-2 font-semibold text-gray-900">{post.title}</p>
          <p className="mt-2 text-[1.5rem] font-semibold text-red-500">
            {Number(post.price).toLocaleString("vi-VN")} đ
          </p>
        </div>

        {post.hiddenReason && (
          <div className="mt-5 rounded-lg border border-amber-100 bg-amber-50 p-4 text-[1.4rem] text-amber-700">
            Lý do đã xóa: {post.hiddenReason}
          </div>
        )}

        <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            disabled={isRestoring}
            onClick={onClose}
            className="h-16 rounded-lg border border-gray-300 px-5 text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Hủy
          </button>
          <button
            type="button"
            disabled={isRestoring}
            onClick={onConfirm}
            className="flex h-16 items-center justify-center gap-3 rounded-lg bg-emerald-600 px-5 text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <FontAwesomeIcon icon={faRotateLeft} />
            Xác nhận khôi phục
          </button>
        </div>
      </div>
    </div>
  );
}

export default RestorePostModal;
