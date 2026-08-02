import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import avatarDefault from "../../../../assets/images/avatar_default.png";
import { formatConversationTime } from "../messages.helpers";
import type { ConversationItem } from "../messages.types";

interface ConversationSidebarProps {
  conversations: ConversationItem[];
  selectedId: number | null;
  search: string;
  isLoading: boolean;
  onSearchChange: (value: string) => void;
  onSelectConversation: (conversationId: number) => void;
}

function ConversationSidebar({
  conversations,
  selectedId,
  search,
  isLoading,
  onSearchChange,
  onSelectConversation,
}: ConversationSidebarProps) {
  return (
    <aside className="flex min-h-0 flex-col border-r border-gray-200 bg-white">
      <div className="shrink-0 border-b border-gray-200 bg-white p-6">
        <h1 className="font-semibold text-gray-900">Tin nhắn</h1>
        <p className="mt-1 text-gray-500">
          Trao đổi giữa người mua và người bán
        </p>
        <div className="relative mt-4 h-[4rem]">
          <FontAwesomeIcon
            icon={faMagnifyingGlass}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            className="h-full w-full rounded-xl border border-gray-300 bg-white pl-12 pr-4 outline-none transition-colors focus:border-amber-400"
            placeholder="Tìm theo tên tin đăng..."
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-6">
        {isLoading ? (
          <div className="mt-20 text-center text-gray-500">
            Đang tải hội thoại...
          </div>
        ) : conversations.length > 0 ? (
          conversations.map((conversation) => (
            <button
              key={conversation.id}
              type="button"
              onClick={() => onSelectConversation(conversation.id)}
              className={`mb-2 flex w-full items-start gap-3 rounded-xl p-4 text-left transition-colors ${
                selectedId === conversation.id ? "bg-cyan-100" : "hover:bg-gray-100"
              }`}
            >
              <div className="relative h-12 w-12 shrink-0">
                <img
                  src={conversation.participant?.avatar || avatarDefault}
                  alt={conversation.participant?.fullName || "Người dùng"}
                  className="h-full w-full rounded-full border border-gray-200 object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate font-medium text-gray-900">
                    {conversation.participant?.fullName || "Người dùng"}
                  </p>
                  <span className="shrink-0 text-[1.4rem] text-gray-400">
                    {formatConversationTime(conversation.lastMessageAt)}
                  </span>
                </div>
                <p className="mt-1 truncate text-[1.4rem] text-gray-500">
                  {conversation.post?.title || "Tin đăng"}
                </p>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <p className="truncate text-gray-500">
                    {conversation.lastMessage || "Chưa có tin nhắn"}
                  </p>
                  {conversation.unreadCount > 0 && (
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-red-500 px-2 text-[1.2rem] text-white">
                      {conversation.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))
        ) : (
          <div className="mt-20 flex h-full items-start justify-center text-center text-gray-500">
            Không có hội thoại phù hợp
          </div>
        )}
      </div>
    </aside>
  );
}

export default ConversationSidebar;
