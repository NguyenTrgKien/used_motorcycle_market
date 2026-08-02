import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClose, faTrash, faWarning } from "@fortawesome/free-solid-svg-icons";
import { defaultDeleteReasons } from "../constants";
import type { AdminManagedPost } from "../types";

interface DeletePostModalProps {
  deleteReason: string;
  isDeleting: boolean;
  post: AdminManagedPost;
  onClose: () => void;
  onConfirm: () => void;
  onReasonChange: (value: string) => void;
}

function DeletePostModal({
  deleteReason,
  isDeleting,
  post,
  onClose,
  onConfirm,
  onReasonChange,
}: DeletePostModalProps) {
  return (
    <div className="fixed inset-0 z-999 flex items-center justify-center bg-black/40 px-5">
      <div className="w-full max-w-[56rem] rounded-lg bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-[2rem] font-semibold text-gray-900">
              Xóa tin đăng
            </h2>
            <p className="mt-1 line-clamp-2 text-[1.4rem] text-gray-500">
              {post.title}
            </p>
          </div>
          <button
            type="button"
            disabled={isDeleting}
            onClick={onClose}
            className="rounded-lg px-3 py-2 text-gray-500 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <FontAwesomeIcon icon={faClose} />
          </button>
        </div>

        <div className="mt-5 rounded-lg border border-amber-100 bg-amber-50 p-5 text-[1.4rem] text-amber-600">
          <FontAwesomeIcon icon={faWarning} />
          <span className="ml-2">
            Đây là xóa mềm: dữ liệu vẫn được giữ trong hệ thống để tra cứu.
          </span>
        </div>

        <div className="mt-5 rounded-lg border border-gray-300 p-4">
          <div className="flex flex-wrap gap-2">
            {defaultDeleteReasons.map((reason) => (
              <button
                key={reason}
                type="button"
                disabled={isDeleting}
                onClick={() => onReasonChange(reason)}
                className={`rounded-full border px-5 py-3 text-start text-[1.4rem] transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                  deleteReason === reason
                    ? "border-red-300 bg-red-50 text-red-600"
                    : "border-gray-300 bg-white text-gray-600 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                }`}
              >
                {reason}
              </button>
            ))}
          </div>
        </div>

        <label className="mt-5 block font-medium text-gray-700" htmlFor="deleteReason">
          Lý do xóa tin
        </label>
        <textarea
          id="deleteReason"
          value={deleteReason}
          disabled={isDeleting}
          onChange={(e) => onReasonChange(e.target.value)}
          rows={4}
          placeholder="Ví dụ: Tin đăng vi phạm quy định, nội dung có dấu hiệu lừa đảo..."
          className="mt-3 w-full resize-none rounded-lg border border-gray-200 bg-gray-50 p-4 outline-none transition-colors focus:border-amber-400 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
        />

        <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            disabled={isDeleting}
            onClick={onClose}
            className="h-16 rounded-lg border border-gray-300 px-5 text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Hủy
          </button>
          <button
            type="button"
            disabled={isDeleting}
            onClick={onConfirm}
            className="flex h-16 items-center justify-center gap-3 rounded-lg bg-red-600 px-5 text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <FontAwesomeIcon icon={faTrash} />
            Xác nhận xóa tin
          </button>
        </div>
      </div>
    </div>
  );
}

export default DeletePostModal;
