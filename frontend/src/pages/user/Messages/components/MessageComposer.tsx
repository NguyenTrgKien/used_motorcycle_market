import {
  faFile,
  faImage,
  faPaperPlane,
  faPaperclip,
  faSmile,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { RefObject } from "react";
import { formatFileSize } from "../messages.helpers";
import type { ConversationItem } from "../messages.types";

const iconOptions = ["👍", "❤️", "😂", "😮", "😢", "🙏", "🔥", "🎉"];

interface MessageComposerProps {
  conversation: ConversationItem;
  content: string;
  selectedFile: File | null;
  selectedFilePreview: string;
  showIconPicker: boolean;
  isSending: boolean;
  messageInputRef: RefObject<HTMLInputElement | null>;
  imageInputRef: RefObject<HTMLInputElement | null>;
  fileInputRef: RefObject<HTMLInputElement | null>;
  iconPickerRef: RefObject<HTMLDivElement | null>;
  iconButtonRef: RefObject<HTMLButtonElement | null>;
  onContentChange: (value: string) => void;
  onPickFile: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onPasteMessage: (event: React.ClipboardEvent<HTMLInputElement>) => void;
  onClearSelectedFile: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onToggleIconPicker: () => void;
  onSendIcon: (icon: string) => void;
}

function MessageComposer({
  conversation,
  content,
  selectedFile,
  selectedFilePreview,
  showIconPicker,
  isSending,
  messageInputRef,
  imageInputRef,
  fileInputRef,
  iconPickerRef,
  iconButtonRef,
  onContentChange,
  onPickFile,
  onPasteMessage,
  onClearSelectedFile,
  onSubmit,
  onToggleIconPicker,
  onSendIcon,
}: MessageComposerProps) {
  return (
    <div className="border-t border-gray-200 bg-white p-5">
      {selectedFile && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 p-3 pr-4">
          {selectedFilePreview ? (
            <img
              src={selectedFilePreview}
              alt={selectedFile.name}
              className="h-20 w-24 rounded-lg object-cover"
            />
          ) : (
            <div className="flex h-20 w-24 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-400">
              <FontAwesomeIcon icon={faFile} />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-gray-800">
              {selectedFile.name}
            </p>
            <p className="text-[1.3rem] text-gray-500">
              {formatFileSize(selectedFile.size)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClearSelectedFile}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-red-500"
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>
      )}

      <form onSubmit={onSubmit} className="relative flex items-center gap-3">
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          onChange={onPickFile}
          className="hidden"
        />
        <input
          ref={fileInputRef}
          type="file"
          onChange={onPickFile}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => imageInputRef.current?.click()}
          className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl border border-gray-300 text-gray-500 transition-colors hover:bg-gray-50"
        >
          <FontAwesomeIcon icon={faImage} className="text-[2.4rem]" />
        </button>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl border border-gray-300 text-gray-500 transition-colors hover:bg-gray-100"
        >
          <FontAwesomeIcon icon={faPaperclip} className="text-[2.2rem]" />
        </button>

        <div className="h-20 flex-1 relative">
          {showIconPicker && (
            <div
              ref={iconPickerRef}
              className="absolute bottom-[calc(100%+0.8rem)] right-0 z-20 grid grid-cols-4 gap-2 rounded-xl border border-gray-200 bg-white p-3 shadow-lg"
            >
              {iconOptions.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => onSendIcon(icon)}
                  className="flex h-12 w-12 items-center justify-center rounded-lg text-[2.4rem] transition-colors hover:bg-gray-100"
                >
                  {icon}
                </button>
              ))}
            </div>
          )}
          <input
            ref={messageInputRef}
            value={content}
            onChange={(event) => onContentChange(event.target.value)}
            onPaste={onPasteMessage}
            className="h-full w-full rounded-xl border border-gray-300 px-5 outline-none transition-colors focus:border-amber-400"
            placeholder={`Nhắn tin với ${
              conversation.participant?.fullName || "người dùng"
            }`}
          />
          <button
            ref={iconButtonRef}
            type="button"
            onClick={onToggleIconPicker}
            className="absolute top-0 right-0 flex h-20 w-20 shrink-0 items-center justify-center rounded-xl text-gray-500"
          >
            <FontAwesomeIcon icon={faSmile} className="text-[2.2rem]" />
          </button>
        </div>
        <button
          type="submit"
          disabled={isSending}
          className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white transition-colors hover:bg-amber-600 disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          <FontAwesomeIcon icon={faPaperPlane} />
        </button>
      </form>
    </div>
  );
}

export default MessageComposer;
