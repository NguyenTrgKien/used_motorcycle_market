import {
  type ChangeEvent,
  type ClipboardEvent,
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { io, Socket } from "socket.io-client";
import axiosInstance from "../../../configs/axiosInstance";
import { useUser } from "../../../hooks/useUser";
import ChatHeader from "./components/ChatHeader";
import ConversationInfoPanel from "./components/ConversationInfoPanel";
import ConversationSidebar from "./components/ConversationSidebar";
import EmptyConversationState from "./components/EmptyConversationState";
import ImagePreviewModal from "./components/ImagePreviewModal";
import MessageComposer from "./components/MessageComposer";
import MessageList from "./components/MessageList";
import PostPreview from "./components/PostPreview";
import { getMessagePreview } from "./messages.helpers";
import type {
  ChatMessage,
  ChatRouteState,
  ConversationItem,
  ConversationUpdatedPayload,
} from "./messages.types";

interface MessagesProps {
  variant?: "customer" | "admin";
}

function Messages({ variant = "customer" }: MessagesProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const chatState = location.state as ChatRouteState | null;
  const isAdminVariant = variant === "admin";
  const { user } = useUser();
  const messageInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const iconPickerRef = useRef<HTMLDivElement>(null);
  const iconButtonRef = useRef<HTMLButtonElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const selectedIdRef = useRef<number | null>(null);
  const conversationIdsRef = useRef<number[]>([]);
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [content, setContent] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFilePreview, setSelectedFilePreview] = useState("");
  const [selectedPreviewImage, setSelectedPreviewImage] = useState("");
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [showConversationInfo, setShowConversationInfo] = useState(false);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [hiddenPostPreviewIds, setHiddenPostPreviewIds] = useState<number[]>(
    [],
  );

  const scrollToLatestMessage = useCallback(
    (behavior: ScrollBehavior = "smooth") => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          messagesEndRef.current?.scrollIntoView({
            behavior,
            block: "end",
          });
        });
      });
    },
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
    selectedConversation.post &&
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

  const sharedImages = useMemo(
    () => messages.filter((message) => message.messageType === "image"),
    [messages],
  );

  const sharedFiles = useMemo(
    () => messages.filter((message) => message.messageType === "file"),
    [messages],
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

      const matchedConversation = chatState?.conversationId
        ? items.find(
            (conversation) => conversation.id === chatState.conversationId,
          )
        : chatState?.postId
          ? items.find(
              (conversation) => conversation.postId === chatState.postId,
            )
          : undefined;

      if (matchedConversation) {
        setSelectedId(matchedConversation.id);
      } else if (
        !chatState?.postId &&
        !chatState?.conversationId &&
        !selectedId
      ) {
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

    setShowConversationInfo(false);
  }, [selectedId]);

  useEffect(() => {
    messageInputRef.current?.focus();
  }, [selectedId]);

  useEffect(() => {
    if (!showIconPicker) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;

      if (
        iconPickerRef.current?.contains(target) ||
        iconButtonRef.current?.contains(target)
      ) {
        return;
      }

      setShowIconPicker(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [showIconPicker]);

  useEffect(() => {
    return () => {
      if (selectedFilePreview) {
        URL.revokeObjectURL(selectedFilePreview);
      }
    };
  }, [selectedFilePreview]);

  useEffect(() => {
    if (!selectedPreviewImage) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedPreviewImage("");
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedPreviewImage]);

  useEffect(() => {
    scrollToLatestMessage("smooth");
  }, [messages.length, scrollToLatestMessage]);

  useEffect(() => {
    if (!selectedId || isLoadingMessages) return;

    scrollToLatestMessage("auto");
  }, [isLoadingMessages, selectedId, scrollToLatestMessage]);

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

  const appendMessage = (message: ChatMessage) => {
    setMessages((currentMessages) => {
      const exists = currentMessages.some((item) => item.id === message.id);

      if (exists) return currentMessages;

      return [...currentMessages, message];
    });
  };

  const updateConversationWithMessage = (
    conversationId: number,
    message: ChatMessage,
  ) => {
    setConversations((currentConversations) =>
      currentConversations.map((conversation) =>
        conversation.id === conversationId
          ? {
              ...conversation,
              lastMessage: getMessagePreview(message),
              lastMessageAt: message.createdAt,
              updatedAt: message.createdAt,
            }
          : conversation,
      ),
    );
  };

  const clearSelectedFile = () => {
    if (selectedFilePreview) {
      URL.revokeObjectURL(selectedFilePreview);
    }

    setSelectedFile(null);
    setSelectedFilePreview("");

    if (imageInputRef.current) imageInputRef.current.value = "";
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const setFileForSending = (file: File) => {
    if (file.size > 20 * 1024 * 1024) {
      toast.error("Tệp không được vượt quá 20MB");
      return false;
    }

    if (selectedFilePreview) {
      URL.revokeObjectURL(selectedFilePreview);
    }

    setSelectedFile(file);
    setSelectedFilePreview(
      file.type.startsWith("image/") ? URL.createObjectURL(file) : "",
    );

    return true;
  };

  const sendMessage = async (payload: FormData | Record<string, string>) => {
    if (!selectedConversation) return;

    const isFormData = payload instanceof FormData;
    const res = await axiosInstance.post<{ data: ChatMessage }>(
      `/api/v1/conversations/${selectedConversation.id}/messages`,
      payload,
      isFormData
        ? {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        : undefined,
    );

    appendMessage(res.data.data);
    updateConversationWithMessage(selectedConversation.id, res.data.data);
  };

  const handlePickFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const isValidFile = setFileForSending(file);

    if (!isValidFile) {
      event.target.value = "";
    }
  };

  const handlePasteMessage = (event: ClipboardEvent<HTMLInputElement>) => {
    const imageItem = Array.from(event.clipboardData.items).find((item) =>
      item.type.startsWith("image/"),
    );

    if (!imageItem) return;

    const imageFile = imageItem.getAsFile();

    if (!imageFile) return;

    const extension = imageFile.type.split("/")[1] || "png";
    const pastedFile = new File(
      [imageFile],
      `clipboard-image-${Date.now()}.${extension}`,
      {
        type: imageFile.type,
        lastModified: Date.now(),
      },
    );

    const isValidFile = setFileForSending(pastedFile);

    if (isValidFile) {
      event.preventDefault();
    }
  };

  const handleSendIcon = async (icon: string) => {
    if (!selectedConversation || isSending) return;

    try {
      setIsSending(true);
      setShowIconPicker(false);
      await sendMessage({ content: icon, messageType: "icon" });
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Không thể gửi icon");
    } finally {
      setIsSending(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedConversation) return;
    const messageContent = content.trim();

    if (!messageContent && !selectedFile) {
      toast.error("Vui lòng nhập nội dung tin nhắn hoặc chọn tệp");
      return;
    }

    try {
      setIsSending(true);

      if (selectedFile) {
        const formData = new FormData();
        formData.append("file", selectedFile);

        if (messageContent) {
          formData.append("content", messageContent);
        }

        await sendMessage(formData);
        clearSelectedFile();
      } else {
        await sendMessage({ content: messageContent, messageType: "text" });
      }

      setContent("");
      setShowIconPicker(false);
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

  return (
    <div
      className={
        isAdminVariant
          ? "h-[calc(100vh-10rem)] overflow-hidden p-6"
          : "h-[calc(100vh-6.5rem)] overflow-hidden px-[20rem] pt-[2rem]"
      }
    >
      <div
        className={
          isAdminVariant
            ? "h-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
            : "h-[calc(100vh-9rem)] overflow-hidden rounded-xl border border-gray-200 bg-white"
        }
      >
        <div className="grid h-full min-h-0 grid-cols-[34rem_1fr]">
          <ConversationSidebar
            conversations={filteredConversations}
            selectedId={selectedId}
            search={search}
            isLoading={isLoadingConversations}
            onSearchChange={setSearch}
            onSelectConversation={setSelectedId}
          />

          <section className="flex min-h-0 min-w-0 flex-col">
            {selectedConversation ? (
              <div className="flex min-h-0 flex-1">
                <div className="flex min-w-0 flex-1 flex-col">
                  <ChatHeader
                    conversation={selectedConversation}
                    showConversationInfo={showConversationInfo}
                    onCallParticipant={handleCallParticipant}
                    onToggleConversationInfo={() =>
                      setShowConversationInfo((currentValue) => !currentValue)
                    }
                  />
                  <PostPreview
                    conversation={selectedConversation}
                    price={selectedPostPrice}
                    isVisible={showPostPreview}
                    onHide={() =>
                      setHiddenPostPreviewIds((currentIds) => [
                        ...currentIds,
                        selectedConversation.id,
                      ])
                    }
                  />
                  <MessageList
                    messages={messages}
                    currentUserId={user?.id}
                    isLoading={isLoadingMessages}
                    messagesEndRef={messagesEndRef}
                    onPreviewImage={setSelectedPreviewImage}
                    onImageLoad={() => scrollToLatestMessage("auto")}
                  />
                  <MessageComposer
                    conversation={selectedConversation}
                    content={content}
                    selectedFile={selectedFile}
                    selectedFilePreview={selectedFilePreview}
                    showIconPicker={showIconPicker}
                    isSending={isSending}
                    messageInputRef={messageInputRef}
                    imageInputRef={imageInputRef}
                    fileInputRef={fileInputRef}
                    iconPickerRef={iconPickerRef}
                    iconButtonRef={iconButtonRef}
                    onContentChange={setContent}
                    onPickFile={handlePickFile}
                    onPasteMessage={handlePasteMessage}
                    onClearSelectedFile={clearSelectedFile}
                    onSubmit={handleSubmit}
                    onToggleIconPicker={() =>
                      setShowIconPicker((value) => !value)
                    }
                    onSendIcon={(icon) => void handleSendIcon(icon)}
                  />
                </div>

                <ConversationInfoPanel
                  isOpen={showConversationInfo}
                  sharedImages={sharedImages}
                  sharedFiles={sharedFiles}
                  onClose={() => setShowConversationInfo(false)}
                  onPreviewImage={setSelectedPreviewImage}
                />
              </div>
            ) : (
              <EmptyConversationState
                onGoHome={() => navigate(isAdminVariant ? "/admin" : "/")}
              />
            )}
          </section>
        </div>
      </div>
      <ImagePreviewModal
        imageUrl={selectedPreviewImage}
        onClose={() => setSelectedPreviewImage("")}
      />
    </div>
  );
}

export default Messages;
