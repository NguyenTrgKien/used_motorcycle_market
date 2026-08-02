import {
  faArrowLeft,
  faBars,
  faPhone,
  faShieldHalved,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import avatarDefault from "../../../../assets/images/avatar_default.png";
import type { ConversationItem } from "../messages.types";

interface ChatHeaderProps {
  conversation: ConversationItem;
  showConversationInfo: boolean;
  onCallParticipant: () => void;
  onToggleConversationInfo: () => void;
}

function ChatHeader({
  conversation,
  showConversationInfo,
  onCallParticipant,
  onToggleConversationInfo,
}: ChatHeaderProps) {
  return (
    <div className="flex h-[7.2rem] items-center justify-between border-b border-gray-200 px-6">
      <div className="flex min-w-0 items-center gap-4">
        <button
          type="button"
          className="hidden h-10 w-10 items-center justify-center rounded-xl border border-gray-300 text-gray-500"
        >
          <FontAwesomeIcon icon={faArrowLeft} />
        </button>
        <img
          src={conversation.participant?.avatar || avatarDefault}
          alt={conversation.participant?.fullName || "Người dùng"}
          className="h-12 w-12 rounded-full border border-gray-200 object-cover"
        />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="truncate font-medium text-gray-900">
              {conversation.participant?.fullName || "Người dùng"}
            </p>
            {conversation.participant?.isVerified && (
              <FontAwesomeIcon
                icon={faShieldHalved}
                className="text-green-500"
              />
            )}
          </div>
          <p className="truncate text-gray-500">
            {conversation.post?.title || "Tin đăng"}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onCallParticipant}
          title="Gọi"
          aria-label="Gọi"
          className="flex h-14 w-14 items-center justify-center rounded-xl border border-gray-300 text-gray-500 transition-colors hover:bg-gray-50"
        >
          <FontAwesomeIcon icon={faPhone} />
        </button>
        <button
          type="button"
          onClick={onToggleConversationInfo}
          title="Xem thông tin"
          aria-label="Xem thông tin"
          className="flex h-14 w-14 items-center justify-center rounded-xl border border-gray-300 text-gray-500 transition-colors hover:bg-gray-50"
        >
          <FontAwesomeIcon icon={showConversationInfo ? faXmark : faBars} />
        </button>
      </div>
    </div>
  );
}

export default ChatHeader;
