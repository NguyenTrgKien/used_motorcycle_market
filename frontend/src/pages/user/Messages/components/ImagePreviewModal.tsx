import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

interface ImagePreviewModalProps {
  imageUrl: string;
  onClose: () => void;
}

function ImagePreviewModal({ imageUrl, onClose }: ImagePreviewModalProps) {
  if (!imageUrl) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 p-8"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-8 top-8 flex h-14 w-14 items-center justify-center rounded-full bg-white/15 text-white transition-colors hover:bg-white/25"
        aria-label="Đóng"
        title="Đóng"
      >
        <FontAwesomeIcon icon={faXmark} className="text-[2.4rem]" />
      </button>
      <img
        src={imageUrl}
        alt="Hình ảnh"
        className="max-h-full max-w-full object-contain"
        onClick={(event) => event.stopPropagation()}
      />
    </div>
  );
}

export default ImagePreviewModal;
