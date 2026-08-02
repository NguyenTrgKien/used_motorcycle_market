import { faFile, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  formatFileSize,
  formatTime,
  parseFileMessage,
} from "../messages.helpers";
import type { ChatMessage } from "../messages.types";

interface ConversationInfoPanelProps {
  isOpen: boolean;
  sharedImages: ChatMessage[];
  sharedFiles: ChatMessage[];
  onClose: () => void;
  onPreviewImage: (imageUrl: string) => void;
}

function ConversationInfoPanel({
  isOpen,
  sharedImages,
  sharedFiles,
  onClose,
  onPreviewImage,
}: ConversationInfoPanelProps) {
  return (
    <aside
      aria-hidden={!isOpen}
      className={`flex shrink-0 overflow-hidden border-l bg-white transition-[width,border-color] duration-300 ease-out ${
        isOpen
          ? "w-[34rem] border-gray-200"
          : "pointer-events-none w-0 border-transparent"
      }`}
    >
      <div
        className={`flex h-full w-[34rem] shrink-0 flex-col transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex h-[6rem] items-center justify-between border-b border-gray-200 px-5">
          <p className="font-semibold text-gray-900">Thông tin hội thoại</p>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-red-500"
            title="Đóng"
            aria-label="Đóng"
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          <div className="border-b border-gray-200 py-5">
            <div className="mb-3 flex items-center justify-between">
              <p className="font-semibold text-gray-900">Hình ảnh</p>
              <span className="text-[1.3rem] text-gray-400">
                {sharedImages.length}
              </span>
            </div>
            {sharedImages.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {sharedImages.map((message) => (
                  <button
                    key={message.id}
                    type="button"
                    onClick={() => onPreviewImage(message.content)}
                    className="aspect-square cursor-zoom-in overflow-hidden rounded-lg border border-gray-200 bg-gray-50"
                  >
                    <img
                      src={message.content}
                      alt="Hình ảnh"
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            ) : (
              <div className="rounded-xl bg-gray-50 p-4 text-center text-[1.4rem] text-gray-500">
                Chưa có hình ảnh
              </div>
            )}
          </div>

          <div className="py-5">
            <div className="mb-3 flex items-center justify-between">
              <p className="font-semibold text-gray-900">Tệp đính kèm</p>
              <span className="text-[1.3rem] text-gray-400">
                {sharedFiles.length}
              </span>
            </div>
            {sharedFiles.length > 0 ? (
              <div className="flex flex-col gap-2">
                {sharedFiles.map((message) => {
                  const file = parseFileMessage(message.content);

                  return (
                    <a
                      key={message.id}
                      href={file.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-3 rounded-xl border border-gray-200 p-3 transition-colors hover:bg-gray-50"
                    >
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                        <FontAwesomeIcon icon={faFile} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium text-gray-800">
                          {file.name}
                        </span>
                        <span className="block text-[1.3rem] text-gray-500">
                          {formatFileSize(file.size) ||
                            formatTime(message.createdAt)}
                        </span>
                      </span>
                    </a>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-xl bg-gray-50 p-4 text-center text-[1.4rem] text-gray-500">
                Chưa có tệp đính kèm
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}

export default ConversationInfoPanel;
