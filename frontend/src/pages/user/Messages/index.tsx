import {
  faArrowLeft,
  faCircleInfo,
  faImage,
  faMagnifyingGlass,
  faPaperPlane,
  faPhone,
  faShieldHalved,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { io, Socket } from "socket.io-client";
import { toast } from "react-toastify";
import avatarDefault from "../../../assets/images/avatar_default.png";
import axiosInstance from "../../../configs/axiosInstance";
import { useUser } from "../../../hooks/useUser";

interface ChatRouteState {
  postId?: number;
}

interface ConversationPost {
  id: number;
  slug: string;
  title: string;
  price: number;
  imageUrl?: string;
}

interface ConversationParticipant {
  id: number;
  fullName?: string;
  avatar?: string;
  phone?: string;
  isVerified?: boolean;
}

interface ConversationItem {
  id: number;
  buyerId: number;
  sellerId: number;
  postId: number;
  participant?: ConversationParticipant;
  post?: ConversationPost;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

interface ChatMessage {
  id: number;
  senderId: number;
  conversationId: number;
  content: string;
  messageType: string;
  isRead: boolean;
  createdAt: string;
  sender?: {
    id: number;
    fullName?: string;
    avatar?: string;
  };
}

interface ConversationUpdatedPayload {
  conversationId: number;
  senderId: number;
  lastMessage: string;
  lastMessageAt: string;
  updatedAt: string;
}

function formatTime(value?: string) {
  if (!value) return "";

  return new Date(value).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Messages() {
  const navigate = useNavigate();
  const location = useLocation();
  const chatState = location.state as ChatRouteState | null;
  const { user } = useUser();
  const messageInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const selectedIdRef = useRef<number | null>(null);
  const conversationIdsRef = useRef<number[]>([]);
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [content, setContent] = useState("");
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [hiddenPostPreviewIds, setHiddenPostPreviewIds] = useState<number[]>(
    [],
  );

  const selectedConversation = conversations.find(
    (conversation) => conversation.id === selectedId,
  );
  const selectedPostPrice = selectedConversation?.post?.price
    ? Number(selectedConversation.post.price).toLocaleString("vi-VN")
    : "";
  const showPostPreview = Boolean(
    selectedConversation &&
    !hiddenPostPreviewIds.includes(selectedConversation.id),
  );

  const visibleConversations = useMemo(
    () =>
      conversations.filter((conversation) => conversation.lastMessage.trim()),
    [conversations],
  );

  const filteredConversations = useMemo(
    () =>
      visibleConversations.filter((conversation) =>
        `${conversation.participant?.fullName || ""} ${
          conversation.post?.title || ""
        }`
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    [visibleConversations, search],
  );

  const upsertConversation = (conversation: ConversationItem) => {
    setConversations((currentConversations) => {
      const exists = currentConversations.some(
        (item) => item.id === conversation.id,
      );

      if (exists) {
        return currentConversations.map((item) =>
          item.id === conversation.id ? conversation : item,
        );
      }

      return [conversation, ...currentConversations];
    });
  };

  const updateConversationAfterMessage = useCallback(
    (payload: ConversationUpdatedPayload) => {
      setConversations((currentConversations) =>
        currentConversations
          .map((conversation) =>
            conversation.id === payload.conversationId
              ? {
                  ...conversation,
                  lastMessage: payload.lastMessage,
                  lastMessageAt: payload.lastMessageAt,
                  updatedAt: payload.updatedAt,
                  unreadCount:
                    payload.senderId !== user?.id &&
                    selectedIdRef.current !== payload.conversationId
                      ? conversation.unreadCount + 1
                      : conversation.unreadCount,
                }
              : conversation,
          )
          .sort(
            (a, b) =>
              new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
          ),
      );
    },
    [user?.id],
  );

  const fetchConversations = async () => {
    try {
      setIsLoadingConversations(true);
      const res = await axiosInstance.get<{ data: ConversationItem[] }>(
        "/api/v1/conversations",
      );
      const items = res.data.data || [];
      setConversations(items);

      const matchedConversation = chatState?.postId
        ? items.find((conversation) => conversation.postId === chatState.postId)
        : undefined;

      if (matchedConversation) {
        setSelectedId(matchedConversation.id);
      } else if (!chatState?.postId && !selectedId) {
        setSelectedId(items[0]?.id || null);
      }
      return Boolean(matchedConversation);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Không thể tải danh sách hội thoại",
      );
      return false;
    } finally {
      setIsLoadingConversations(false);
    }
  };

  const startConversation = async (postId: number) => {
    try {
      const res = await axiosInstance.post<{ data: ConversationItem }>(
        "/api/v1/conversations/start",
        { postId },
      );
      upsertConversation(res.data.data);
      setSelectedId(res.data.data.id);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Không thể mở hội thoại");
    }
  };

  const fetchMessages = async (conversationId: number) => {
    try {
      setIsLoadingMessages(true);
      const res = await axiosInstance.get<{ data: ChatMessage[] }>(
        `/api/v1/conversations/${conversationId}/messages`,
      );
      setMessages(res.data.data || []);
      await axiosInstance.patch(`/api/v1/conversations/${conversationId}/read`);
      setConversations((currentConversations) =>
        currentConversations.map((conversation) =>
          conversation.id === conversationId
            ? { ...conversation, unreadCount: 0 }
            : conversation,
        ),
      );
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Không thể tải tin nhắn");
    } finally {
      setIsLoadingMessages(false);
    }
  };

  useEffect(() => {
    const loadConversations = async () => {
      const hasMatchedConversation = await fetchConversations();

      if (chatState?.postId && !hasMatchedConversation) {
        void startConversation(chatState.postId);
      }
    };

    void loadConversations();
  }, []);

  useEffect(() => {
    if (selectedId) {
      void fetchMessages(selectedId);
    } else {
      setMessages([]);
    }
  }, [selectedId]);

  useEffect(() => {
    messageInputRef.current?.focus();
  }, [selectedId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages]);

  useEffect(() => {
    selectedIdRef.current = selectedId;
  }, [selectedId]);

  useEffect(() => {
    conversationIdsRef.current = conversations.map(
      (conversation) => conversation.id,
    );
  }, [conversations]);

  useEffect(() => {
    if (!user?.id) return;

    const socket = io("http://localhost:8080", {
      withCredentials: true,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      if (selectedIdRef.current) {
        socket.emit("conversation.join", {
          conversationId: selectedIdRef.current,
        });
      }
    });

    socket.on("message.created", (message: ChatMessage) => {
      if (selectedIdRef.current === message.conversationId) {
        setMessages((currentMessages) => {
          const exists = currentMessages.some((item) => item.id === message.id);

          if (exists) return currentMessages;

          return [...currentMessages, message];
        });

        if (message.senderId !== user.id) {
          void axiosInstance.patch(
            `/api/v1/conversations/${message.conversationId}/read`,
          );
        }
      }
    });

    socket.on("conversation.updated", (payload: ConversationUpdatedPayload) => {
      if (!conversationIdsRef.current.includes(payload.conversationId)) {
        void fetchConversations();
      }

      updateConversationAfterMessage(payload);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [updateConversationAfterMessage, user?.id]);

  useEffect(() => {
    const socket = socketRef.current;

    if (!socket || !selectedId) return;

    socket.emit("conversation.join", { conversationId: selectedId });

    return () => {
      socket.emit("conversation.leave", { conversationId: selectedId });
    };
  }, [selectedId]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedConversation) return;
    if (!content.trim()) {
      toast.error("Vui lòng nhập nội dung tin nhắn");
      return;
    }

    try {
      setIsSending(true);
      const res = await axiosInstance.post<{ data: ChatMessage }>(
        `/api/v1/conversations/${selectedConversation.id}/messages`,
        { content },
      );
      setMessages((currentMessages) => {
        const exists = currentMessages.some(
          (message) => message.id === res.data.data.id,
        );

        if (exists) return currentMessages;

        return [...currentMessages, res.data.data];
      });
      setContent("");
      setConversations((currentConversations) =>
        currentConversations.map((conversation) =>
          conversation.id === selectedConversation.id
            ? {
                ...conversation,
                lastMessage: res.data.data.content,
                lastMessageAt: res.data.data.createdAt,
                updatedAt: res.data.data.createdAt,
              }
            : conversation,
        ),
      );
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Không thể gửi tin nhắn");
    } finally {
      setIsSending(false);
    }
  };

  const handleCallParticipant = () => {
    if (!selectedConversation?.participant?.phone) {
      toast.info("Người dùng chưa công khai số điện thoại");
      return;
    }

    window.location.href = `tel:${selectedConversation.participant.phone}`;
  };

  const handleViewParticipantInfo = () => {
    if (!selectedConversation?.participant?.id) return;

    navigate(`/users/${selectedConversation.participant.id}`);
  };

  return (
    <div className="h-screen overflow-hidden px-[10rem] pt-[9rem]">
      <div className="h-[calc(100vh-9rem)] overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="grid h-full min-h-0 grid-cols-[34rem_1fr]">
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
                  onChange={(event) => setSearch(event.target.value)}
                  className="h-full w-full rounded-xl border border-gray-300 bg-white pl-12 pr-4 outline-none transition-colors focus:border-amber-400"
                  placeholder="Tìm theo tên tin đăng..."
                />
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-6">
              {isLoadingConversations ? (
                <div className="mt-20 text-center text-gray-500">
                  Đang tải hội thoại...
                </div>
              ) : filteredConversations.length > 0 ? (
                filteredConversations.map((conversation) => (
                  <button
                    key={conversation.id}
                    type="button"
                    onClick={() => setSelectedId(conversation.id)}
                    className={`mb-2 flex w-full items-start gap-3 rounded-xl p-4 text-left transition-colors ${
                      selectedId === conversation.id
                        ? "bg-cyan-100"
                        : "hover:bg-gray-100"
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
                          {formatTime(conversation.lastMessageAt)}
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
                  {visibleConversations.length === 0
                    ? "Chưa có cuộc hội thoại nào"
                    : "Không tìm thấy cuộc hội thoại"}
                </div>
              )}
            </div>
          </aside>

          <section className="flex min-h-0 min-w-0 flex-col ">
            {selectedConversation ? (
              <>
                <div className="flex h-[7.2rem] items-center justify-between border-b border-gray-200 px-6">
                  <div className="flex min-w-0 items-center gap-4">
                    <button
                      type="button"
                      className="hidden h-10 w-10 items-center justify-center rounded-xl border border-gray-300 text-gray-500"
                    >
                      <FontAwesomeIcon icon={faArrowLeft} />
                    </button>
                    <img
                      src={
                        selectedConversation.participant?.avatar ||
                        avatarDefault
                      }
                      alt={
                        selectedConversation.participant?.fullName ||
                        "Người dùng"
                      }
                      className="h-12 w-12 rounded-full border border-gray-200 object-cover"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-medium text-gray-900">
                          {selectedConversation.participant?.fullName ||
                            "Người dùng"}
                        </p>
                        {selectedConversation.participant?.isVerified && (
                          <FontAwesomeIcon
                            icon={faShieldHalved}
                            className="text-green-500"
                          />
                        )}
                      </div>
                      <p className="truncate text-gray-500">
                        {selectedConversation.post?.title || "Tin đăng"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCallParticipant}
                      title="Gọi"
                      aria-label="Gọi"
                      className="flex h-14 w-14 items-center justify-center rounded-xl border border-gray-300 text-gray-500 transition-colors hover:bg-gray-50"
                    >
                      <FontAwesomeIcon icon={faPhone} />
                    </button>
                    <button
                      type="button"
                      onClick={handleViewParticipantInfo}
                      title="Xem thông tin"
                      aria-label="Xem thông tin"
                      className="flex h-14 w-14 items-center justify-center rounded-xl border border-gray-300 text-gray-500 transition-colors hover:bg-gray-50"
                    >
                      <FontAwesomeIcon icon={faCircleInfo} />
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto bg-gray-100 p-6">
                  {isLoadingMessages ? (
                    <div className="flex h-full flex-col items-center justify-center gap-5">
                      <div className="h-[4rem] w-[4rem] animate-spin rounded-full border-b-1 border-t-2 border-amber-600"></div>
                      <span className="text-[1.4rem] text-gray-500">
                        Đang tải tin nhắn...
                      </span>
                    </div>
                  ) : messages.length > 0 ? (
                    <div className="flex flex-col gap-4">
                      {messages.map((message) => {
                        const isMine = message.senderId === user?.id;
                        return (
                          <div
                            key={message.id}
                            className={`flex ${
                              isMine ? "justify-end" : "justify-start"
                            }`}
                          >
                            <div
                              className={`max-w-[62%] rounded-3xl px-5 py-3 ${
                                isMine
                                  ? "rounded-br-sm bg-amber-500 text-white"
                                  : "rounded-bl-sm border border-gray-200 bg-white text-gray-700"
                              }`}
                            >
                              <p className="leading-relaxed">
                                {message.content}
                              </p>
                              <p
                                className={`mt-1 text-right text-[1.4rem] ${
                                  isMine ? "text-gray-100" : "text-gray-500"
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

                <div className="border-t border-gray-200 bg-white p-5">
                  <div
                    className={`relative mb-4 items-center gap-4 rounded-xl border border-gray-200 bg-gray-50 p-3 pr-14 ${
                      showPostPreview ? "flex" : "hidden"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setHiddenPostPreviewIds((currentIds) =>
                          selectedConversation
                            ? [...currentIds, selectedConversation.id]
                            : currentIds,
                        )
                      }
                      className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-red-500"
                      title="Xóa bài đăng khỏi tin nhắn"
                    >
                      <FontAwesomeIcon icon={faXmark} />
                    </button>
                    <div className="h-20 w-24 shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-white">
                      {selectedConversation.post?.imageUrl ? (
                        <img
                          src={selectedConversation.post.imageUrl}
                          alt={selectedConversation.post.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-gray-300">
                          <FontAwesomeIcon icon={faImage} />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      {selectedConversation.post?.slug ? (
                        <Link
                          to={`/posts/${selectedConversation.post.slug}`}
                          className="line-clamp-1 font-medium text-gray-900 transition-colors hover:text-amber-600"
                        >
                          {selectedConversation.post.title}
                        </Link>
                      ) : (
                        <p className="line-clamp-1 font-medium text-gray-900">
                          {selectedConversation.post?.title || "Tin đăng"}
                        </p>
                      )}
                      {selectedPostPrice && (
                        <p className="mt-1 font-semibold text-amber-600">
                          {selectedPostPrice} đ
                        </p>
                      )}
                    </div>
                  </div>

                  <form
                    onSubmit={handleSubmit}
                    className="flex items-center gap-3"
                  >
                    <button
                      type="button"
                      className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl border border-gray-300 text-gray-500 transition-colors hover:bg-gray-50"
                    >
                      <FontAwesomeIcon
                        icon={faImage}
                        className="text-[2.4rem]"
                      />
                    </button>
                    <input
                      ref={messageInputRef}
                      value={content}
                      onChange={(event) => setContent(event.target.value)}
                      className="h-20 flex-1 rounded-xl border border-gray-300 px-5 outline-none transition-colors focus:border-amber-400"
                      placeholder={`Nhắn tin với ${
                        selectedConversation.participant?.fullName ||
                        "người dùng"
                      }`}
                    />
                    <button
                      type="submit"
                      disabled={isSending}
                      className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white transition-colors hover:bg-amber-600 disabled:cursor-not-allowed disabled:bg-gray-300"
                    >
                      <FontAwesomeIcon icon={faPaperPlane} />
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex h-full flex-col items-center justify-center">
                <img
                  src="https://www.shutterstock.com/image-vector/young-man-woman-having-friendly-600nw-2723715093.jpg"
                  alt=""
                  className="w-[50rem]"
                />
                <div className="text-center text-gray-500">
                  <div>
                    <p className="text-[1.8rem] font-medium text-gray-900">
                      Bạn chưa có cuộc trò chuyện nào!
                    </p>
                    <p className="mt-2">
                      Trải nghiệm chat để làm rõ thông tin về mặt hàng trước khi
                      bắt đầu thực hiện mua bán
                    </p>
                    <button
                      className="mt-6 rounded-md bg-amber-400 px-5 py-2 text-white transition-colors hover:bg-amber-500"
                      onClick={() => {
                        navigate("/");
                      }}
                    >
                      Về trang chủ
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

export default Messages;
