import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClose } from "@fortawesome/free-solid-svg-icons";
import type { AdminManagedPost } from "../types";

interface ReasonModalProps {
  post: AdminManagedPost;
  onClose: () => void;
}

function ReasonModal({ post, onClose }: ReasonModalProps) {
  return (
    <div className="fixed inset-0 z-999 flex items-center justify-center bg-black/40 px-5">
      <div className="w-full max-w-[52rem] rounded-lg bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-[2rem] font-semibold text-gray-900">
              Lý do xử lý
            </h2>
            <p className="mt-1 line-clamp-2 text-[1.4rem] text-gray-500">
              {post.title}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-2 text-gray-500 transition-colors hover:bg-gray-100"
          >
            <FontAwesomeIcon icon={faClose} />
          </button>
        </div>

        <div className="mt-5 max-h-[45vh] overflow-y-auto rounded-lg border border-red-100 bg-red-50 p-5 text-[1.4rem] leading-relaxed text-red-700">
          {post.rejectedReason || post.hiddenReason}
        </div>

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="h-14 rounded-lg border border-gray-300 px-5 text-gray-600 transition-colors hover:bg-gray-50"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

export default ReasonModal;
