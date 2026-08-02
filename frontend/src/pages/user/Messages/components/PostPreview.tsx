import { faImage, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Link } from "react-router-dom";
import type { ConversationItem } from "../messages.types";

interface PostPreviewProps {
  conversation: ConversationItem;
  price: string;
  isVisible: boolean;
  onHide: () => void;
}

function PostPreview({ conversation, price, isVisible, onHide }: PostPreviewProps) {
  return (
    <div
      className={`relative items-center gap-4 border-b border-gray-200 bg-white p-4 pr-16 ${
        isVisible ? "flex" : "hidden"
      }`}
    >
      <button
        type="button"
        onClick={onHide}
        className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-red-500"
        title="Xóa bài đăng khỏi tin nhắn"
      >
        <FontAwesomeIcon icon={faXmark} />
      </button>
      <div className="h-20 w-24 shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-white">
        {conversation.post?.imageUrl ? (
          <img
            src={conversation.post.imageUrl}
            alt={conversation.post.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-gray-300">
            <FontAwesomeIcon icon={faImage} />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        {conversation.post?.slug ? (
          <Link
            to={`/posts/${conversation.post.slug}`}
            className="line-clamp-1 font-medium text-gray-900 transition-colors hover:text-amber-600"
          >
            {conversation.post.title}
          </Link>
        ) : (
          <p className="line-clamp-1 font-medium text-gray-900">
            {conversation.post?.title || "Tin đăng"}
          </p>
        )}
        {price && <p className="mt-1 font-semibold text-amber-600">{price} đ</p>}
      </div>
    </div>
  );
}

export default PostPreview;
