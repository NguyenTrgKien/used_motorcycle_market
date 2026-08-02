import { faFile } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { RefObject } from "react";
import {
  formatFileSize,
  formatTime,
  parseFileMessage,
} from "../messages.helpers";
import type { ChatMessage } from "../messages.types";

interface MessageListProps {
  messages: ChatMessage[];
  currentUserId?: number;
  isLoading: boolean;
  messagesEndRef: RefObject<HTMLDivElement | null>;
  onPreviewImage: (imageUrl: string) => void;
  onImageLoad: () => void;
}

function MessageList({
  messages,
  currentUserId,
  isLoading,
  messagesEndRef,
  onPreviewImage,
  onImageLoad,
}: MessageListProps) {
  const renderMessageContent = (message: ChatMessage, isMine: boolean) => {
    if (message.messageType === "image") {
      return (
        <button
          type="button"
          onClick={() => onPreviewImage(message.content)}
          className="block cursor-zoom-in shadow-sm"
        >
          <img
            src={message.content}
            onLoad={onImageLoad}
            alt="Hình ảnh"
            className="max-h-[34rem] w-full object-contain"
          />
        </button>
      );
    }

    if (message.messageType === "file") {
      const file = parseFileMessage(message.content);

      return (
        <a
          href={file.url}
          target="_blank"
          rel="noreferrer"
          className={`flex items-center gap-3 rounded-2xl border p-3 ${
            isMine
              ? "border-amber-200 bg-blue-500 text-white"
              : "border-gray-200 bg-gray-50 text-gray-700"
          }`}
        >
          <FontAwesomeIcon icon={faFile} className="text-[2.2rem]" />
          <span className="min-w-0">
            <span className="block truncate font-medium">{file.name}</span>
            {formatFileSize(file.size) && (
              <span
                className={`block text-[1.3rem] ${
                  isMine ? "text-gray-100" : "text-gray-500"
                }`}
              >
                {formatFileSize(file.size)}
              </span>
            )}
          </span>
        </a>
      );
    }

    if (message.messageType === "icon") {
      return <p className="text-[3.6rem] leading-none">{message.content}</p>;
    }

    return <p className="leading-relaxed">{message.content}</p>;
  };

  return (
    <div className="flex-1 overflow-y-auto bg-gray-100 p-6">
      {isLoading ? (
        <div className="flex h-full flex-col items-center justify-center gap-5">
          <div className="h-[4rem] w-[4rem] animate-spin rounded-full border-b-1 border-t-2 border-amber-600"></div>
          <span className="text-[1.4rem] text-gray-500">
            Đang tải tin nhắn...
          </span>
        </div>
      ) : messages.length > 0 ? (
        <div className="flex flex-col gap-4">
          {messages.map((message) => {
            const isMine = message.senderId === currentUserId;
            const isImage = message.messageType === "image";

            return (
              <div
                key={message.id}
                className={`flex ${isMine ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={
                    isImage
                      ? "max-w-[72%]"
                      : `max-w-[62%] rounded-4xl px-8 py-3 ${
                          isMine
                            ? "rounded-br-sm border border-gray-200 bg-blue-100 text-gray-900"
                            : "rounded-bl-sm border border-gray-200 bg-white text-gray-700"
                        }`
                  }
                >
                  {renderMessageContent(message, isMine)}
                  <p
                    className={`mt-1 text-right text-[1.2rem] ${
                      isMine ? "text-gray-600" : "text-gray-500"
                    }`}
                  >
                    {formatTime(message.createdAt)}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      ) : (
        <div className="mt-20 text-center text-gray-500">
          Chưa có tin nhắn nào
        </div>
      )}
    </div>
  );
}

export default MessageList;
