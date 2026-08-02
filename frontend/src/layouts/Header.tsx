import logo from "../assets/images/logo(1).png";
import avatar_default from "../assets/images/avatar_default.png";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faAngleDown,
  faAngleRight,
  faBars,
  faCircleQuestion,
  faClockRotateLeft,
  faGear,
  faKey,
  faLocationDot,
  faMagnifyingGlass,
  faRightFromBracket,
  faSearch,
  faStar,
  faTableCells,
} from "@fortawesome/free-solid-svg-icons";
import {
  faBell,
  faCommentDots,
  faHeart,
} from "@fortawesome/free-regular-svg-icons";
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { io, Socket } from "socket.io-client";
import HeaderBanner from "../components/HeaderBanner";
import LoginAndRegisterModal from "../components/auth/Login&RegisterModal";
import { useUser } from "../hooks/useUser";
import { useAuth } from "../hooks/useAuth";
import ChooseAddress from "../components/ChooseAdress";
import useAuthModal from "../hooks/useAuthModal";
import axiosInstance from "../configs/axiosInstance";
import { useLocationSelection } from "../contexts/LocationContext";
import {
  NotificationType,
  type NotificationType as NotificationTypeValue,
} from "../shared";
import CategoryMenuPopup from "../components/CategoryMenuPopup";

interface HeaderNotification {
  id: number;
  title: string;
  content: string;
  isRead: boolean;
  type: NotificationTypeValue;
  referenceId: number;
  createdAt: string;
}

interface HeaderNotificationsResponse {
  data: HeaderNotification[];
  unreadCount: number;
}

const utilities = [
  {
    id: 1,
    title: "Tin đăng đã lưu",
    icon: faHeart,
    link: "/saved-listings",
  },
  {
    id: 2,
    title: "Tìm kiếm đã lưu",
    icon: faMagnifyingGlass,
    link: "/saved-searches",
  },
  {
    id: 3,
    title: "Thông báo",
    icon: faBell,
    link: "/notifications",
  },
  {
    id: 4,
    title: "Lịch sử xem tin",
    icon: faClockRotateLeft,
    link: "/history",
  },
  { id: 5, title: "Đánh giá từ tôi", icon: faStar, link: "/my-reviews" },
];
const others = [
  {
    id: 1,
    title: "Cài đặt tài khoản",
    icon: faGear,
    link: "/setting/profile",
  },
  { id: 2, title: "Đổi mật khẩu", icon: faKey, link: "/change-password" },
  { id: 3, title: "Trợ giúp", icon: faCircleQuestion, link: "/support" },
  {
    id: 4,
    title: "Đăng xuất",
    icon: faRightFromBracket,
    color: "text-red-500",
  },
];

function Header() {
  const navigate = useNavigate();
  const { user } = useUser();
  const { logout } = useAuth();
  const { location: selectedLocation } = useLocationSelection();
  const { isOpen, openAuthModal, closeAuthModal } = useAuthModal();
  const location = useLocation();
  const isFixedHard =
    location.pathname.startsWith("/setting") ||
    location.pathname.startsWith("/users") ||
    location.pathname.startsWith("/messages") ||
    location.pathname.startsWith("/notifications") ||
    location.pathname.startsWith("/saved-listings") ||
    location.pathname.startsWith("/vehicles") ||
    location.pathname.startsWith("/posts");
  const [showPopup, setShowPopup] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const notificationSocketRef = useRef<Socket | null>(null);
  const elementAreaRef = useRef<HTMLDivElement>(null);
  const elementAreaMobileRef = useRef<HTMLDivElement>(null);
  const headerLocationRef = useRef<HTMLDivElement>(null);
  const categoryMenuRef = useRef<HTMLDivElement>(null);
  const [isFixed, setIsFixed] = useState(false);
  const [showPopupArea, setShowPopupArea] = useState(false);
  const [showHeaderLocation, setShowHeaderLocation] = useState(false);
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const [showMenuBar, setShowMenuBar] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [notifications, setNotifications] = useState<HeaderNotification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState(
    () => new URLSearchParams(window.location.search).get("keyword") || "",
  );

  useEffect(() => {
    const handleClickOutSide = (e: MouseEvent) => {
      if (
        elementRef.current &&
        !elementRef.current.contains(e.target as Node)
      ) {
        setShowPopup(false);
      }
      if (
        notificationRef.current &&
        !notificationRef.current.contains(e.target as Node)
      ) {
        setShowNotifications(false);
      }
      if (
        categoryMenuRef.current &&
        !categoryMenuRef.current.contains(e.target as Node)
      ) {
        setShowCategoryMenu(false);
      }
      const locationContainers = [
        elementAreaRef.current,
        elementAreaMobileRef.current,
        headerLocationRef.current,
      ].filter(Boolean) as HTMLDivElement[];
      if (
        !locationContainers.some((container) =>
          container.contains(e.target as Node),
        )
      ) {
        setShowPopupArea(false);
        setShowHeaderLocation(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutSide);
    return () => document.removeEventListener("mousedown", handleClickOutSide);
  }, []);

  useEffect(() => {
    const handleScroll = () => setIsFixed(window.scrollY > 150);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setSearchKeyword(
      new URLSearchParams(location.search).get("keyword") || "",
    );
  }, [location.search]);

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user) {
        setUnreadNotifications(0);
        setNotifications([]);
        return;
      }

      try {
        setIsLoadingNotifications(true);
        const res = await axiosInstance.get<HeaderNotificationsResponse>(
          "/api/v1/notifications",
        );
        setNotifications(res.data.data || []);
        setUnreadNotifications(res.data.unreadCount || 0);
      } catch {
        setNotifications([]);
        setUnreadNotifications(0);
      } finally {
        setIsLoadingNotifications(false);
      }
    };

    void fetchNotifications();
  }, [user]);

  const handleLogout = async () => await logout();

  const handleSearchMotor = () => {
    const searchParams = new URLSearchParams();
    const keyword = searchKeyword.trim();

    if (keyword) {
      searchParams.set("keyword", keyword);
    }
    if (selectedLocation?.province) {
      searchParams.set("province", selectedLocation.province);
    }

    const query = searchParams.toString();
    navigate(query ? `/vehicles?${query}` : "/vehicles");
  };

  const formatNotificationDate = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";

    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getNotificationPath = (notification: HeaderNotification) => {
    const paths: Record<NotificationTypeValue, string> = {
      [NotificationType.POST_APPROVED]: "/posts/manage",
      [NotificationType.POST_REJECTED]: "/posts/manage",
      [NotificationType.NEW_MESSAGE]: "/messages",
      [NotificationType.NEW_REVIEW]: "/my-reviews",
      [NotificationType.NEW_POST_PENDING]: "/admin/posts/pending",
      [NotificationType.BANK_TRANSFER_SUBMITTED]: "/admin/transactions",
      [NotificationType.BANK_TRANSFER_REJECTED]: "/posts/manage",
      [NotificationType.BANK_TRANSFER_CONFIRMED]: "/posts/manage",
    };

    return paths[notification.type] || "/notifications";
  };

  const handleOpenNotifications = () => {
    if (!user) {
      openAuthModal();
      return;
    }

    setShowNotifications((prev) => !prev);
    setShowPopup(false);
  };

  const handleOpenNotification = async (notification: HeaderNotification) => {
    if (!notification.isRead) {
      setNotifications((prev) =>
        prev.map((item) =>
          item.id === notification.id ? { ...item, isRead: true } : item,
        ),
      );
      setUnreadNotifications((prev) => Math.max(prev - 1, 0));

      try {
        await axiosInstance.patch(
          `/api/v1/notifications/${notification.id}/read`,
        );
      } catch {
        setNotifications((prev) =>
          prev.map((item) =>
            item.id === notification.id ? { ...item, isRead: false } : item,
          ),
        );
        setUnreadNotifications((prev) => prev + 1);
        return;
      }
    }

    setShowNotifications(false);
    navigate(getNotificationPath(notification));
  };

  useEffect(() => {
    if (!user?.id) return;

    const socket = io("http://localhost:8080", {
      withCredentials: true,
    });

    notificationSocketRef.current = socket;

    socket.on("notification.created", (notification: HeaderNotification) => {
      setNotifications((prev) => {
        const exists = prev.some((item) => item.id === notification.id);

        if (exists) return prev;

        return [notification, ...prev].slice(0, 50);
      });

      if (!notification.isRead) {
        setUnreadNotifications((prev) => prev + 1);
      }
    });

    return () => {
      socket.disconnect();
      notificationSocketRef.current = null;
    };
  }, [user?.id]);

  return (
    <>
      <div
        aria-hidden="true"
        className={
          isFixedHard
            ? "h-[6.5rem]"
            : isFixed
              ? "h-[15rem] md:h-[18rem]"
              : "hidden"
        }
      />
      <header
        className={`${isFixed || isFixedHard ? "fixed top-0 left-0 z-50" : "relative"} w-full`}
      >
        {!isFixed && !isFixedHard && (
          <>
            <HeaderBanner />
            <div className="absolute inset-0 bg-gray-500/25"></div>
          </>
        )}

        <div
          className={`absolute top-0 left-0 w-full h-[6.5rem] flex items-center justify-between px-4 sm:px-6 md:px-[2rem] ${isFixed || isFixedHard ? "text-gray-600 bg-white" : "text-white"}`}
        >
          <div className="flex items-center gap-4 md:gap-15 shrink-0">
            <div
              className="md:hidden block gap-1 cursor-pointer"
              onClick={() => setShowMenuBar(true)}
            >
              <FontAwesomeIcon icon={faBars} className="text-[1.8rem]" />
            </div>
            <a href="/">
              <img
                src={logo}
                alt="Mua bán xe máy"
                className="w-[10rem] h-[4rem] md:w-[11rem] lg:w-[12rem] md:h-[4rem] lg:h-[5rem] select-none rounded-full"
              />
            </a>
            <div ref={categoryMenuRef} className="relative hidden md:block">
              <button
                type="button"
                onClick={() => {
                  setShowCategoryMenu((prev) => !prev);
                  setShowHeaderLocation(false);
                  setShowNotifications(false);
                  setShowPopup(false);
                }}
                className="flex items-center gap-1 cursor-pointer"
              >
                <FontAwesomeIcon
                  icon={faTableCells}
                  className="text-[1.8rem]"
                />
                <span>Danh mục</span>
                <FontAwesomeIcon
                  icon={faAngleDown}
                  className={`ml-1 text-[1.2rem] transition-transform ${
                    showCategoryMenu ? "rotate-180" : ""
                  }`}
                />
              </button>
              <AnimatePresence>
                {showCategoryMenu && (
                  <CategoryMenuPopup
                    onClose={() => setShowCategoryMenu(false)}
                  />
                )}
              </AnimatePresence>
            </div>

            {(isFixed || isFixedHard) && (
              <div ref={headerLocationRef} className="relative hidden md:block">
                <button
                  type="button"
                  onClick={() => setShowHeaderLocation((prev) => !prev)}
                  className="flex max-w-[18rem] items-center gap-2"
                >
                  <FontAwesomeIcon
                    icon={faLocationDot}
                    className="text-[1.8rem]"
                  />
                  <span className="truncate">
                    {selectedLocation?.province || "Chọn khu vực"}
                  </span>
                  <FontAwesomeIcon icon={faAngleDown} />
                </button>
                <AnimatePresence>
                  {showHeaderLocation && (
                    <ChooseAddress
                      onClose={() => setShowHeaderLocation(false)}
                    />
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>

          {(isFixed || isFixedHard) && (
            <form
              className="hidden sm:flex flex-1 mx-4 md:mx-6 max-w-[45rem] h-[4rem] relative"
              onSubmit={(event) => {
                event.preventDefault();
                handleSearchMotor();
              }}
            >
              <input
                type="text"
                value={searchKeyword}
                onChange={(event) => setSearchKeyword(event.target.value)}
                className="w-full h-full border border-gray-300 rounded-full focus:border-orange-500 outline-none pl-[2rem] pr-[5rem]"
                placeholder="Xin chào! Hôm này bạn cần tìm gì?"
              />
              <button
                type="submit"
                className="absolute top-0 right-0 w-[5rem] h-[4rem] flex items-center justify-center cursor-pointer text-gray-500"
              >
                <FontAwesomeIcon icon={faSearch} />
              </button>
            </form>
          )}

          <div className="flex items-center gap-4 sm:gap-6 shrink-0">
            <button
              type="button"
              onClick={() =>
                user ? navigate("/saved-listings") : openAuthModal()
              }
              className="relative hidden sm:block cursor-pointer"
            >
              <FontAwesomeIcon icon={faHeart} className="text-[2.2rem]" />
            </button>
            <div className="relative" ref={notificationRef}>
              <button
                type="button"
                onClick={handleOpenNotifications}
                className="relative cursor-pointer"
              >
                <FontAwesomeIcon icon={faBell} className="text-[2.2rem]" />
                {unreadNotifications > 0 && (
                  <span className="absolute -top-3 -right-3 flex h-6 min-w-6 items-center justify-center rounded-full bg-red-500 px-1 text-[1rem] text-white">
                    {unreadNotifications > 99 ? "99+" : unreadNotifications}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    exit={{ opacity: 0, y: -12 }}
                    className="absolute right-[-7rem] top-[calc(100%+1.6rem)] z-[999] w-[calc(100vw-2rem)] max-w-[38rem] overflow-hidden rounded-xl border border-gray-200 bg-white text-gray-700 shadow-xl sm:right-0"
                  >
                    <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                      <div>
                        <p className="font-semibold text-gray-900">Thông báo</p>
                        <p className="text-[1.4rem] text-gray-500">
                          {unreadNotifications} thông báo chưa đọc
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setShowNotifications(false);
                          navigate("/notifications");
                        }}
                        className="text-[1.4rem] font-medium text-orange-600 hover:underline transition-colors"
                      >
                        Xem tất cả
                      </button>
                    </div>

                    <div className="max-h-[34rem] overflow-y-auto">
                      {isLoadingNotifications ? (
                        <div className="space-y-3 p-5">
                          {Array.from({ length: 3 }).map((_, index) => (
                            <div key={index} className="flex gap-3">
                              <div className="h-10 w-10 animate-pulse rounded-full bg-gray-200" />
                              <div className="flex-1 space-y-2">
                                <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200" />
                                <div className="h-3 w-full animate-pulse rounded bg-gray-100" />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : notifications.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                          Chưa có thông báo
                        </div>
                      ) : (
                        notifications.slice(0, 7).map((notification) => (
                          <button
                            key={notification.id}
                            type="button"
                            onClick={() =>
                              void handleOpenNotification(notification)
                            }
                            className={`flex w-full gap-3 border-b border-gray-100 px-5 py-4 text-left transition-colors last:border-b-0 hover:bg-orange-50 ${
                              notification.isRead
                                ? "bg-white"
                                : "bg-orange-50/70"
                            }`}
                          >
                            <span className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-600">
                              <FontAwesomeIcon icon={faBell} />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="flex items-start justify-between gap-3">
                                <span className="line-clamp-1 font-semibold text-gray-900">
                                  {notification.title}
                                </span>
                                {!notification.isRead && (
                                  <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-orange-500" />
                                )}
                              </span>
                              <span className="mt-1 line-clamp-2 text-[1.3rem] text-gray-600">
                                {notification.content}
                              </span>
                              <span className="mt-2 block text-[1.2rem] text-gray-400">
                                {formatNotificationDate(notification.createdAt)}
                              </span>
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <button
              onClick={() => (user ? navigate("/messages") : openAuthModal())}
              className={`hidden lg:flex items-center gap-1 px-5 h-[4rem] rounded-full ${!isFixed && !isFixedHard ? "bg-white text-gray-600" : "border border-gray-300"} hover:cursor-pointer`}
            >
              <FontAwesomeIcon icon={faCommentDots} />
              <span>Tin nhắn</span>
            </button>
            <button
              onClick={() =>
                user ? navigate("/posts/manage") : openAuthModal()
              }
              className={`hidden lg:block px-5 h-[4rem] rounded-full ${!isFixed && !isFixedHard ? "bg-white text-gray-600" : "border border-gray-300"} hover:cursor-pointer`}
            >
              Quản lý tin
            </button>

            {user ? (
              <div className="relative text-gray-600" ref={elementRef}>
                <button
                  className={`relative w-auto h-[4rem] flex items-center gap-2.5 rounded-full px-2 cursor-pointer transition-colors duration-300 ${!isFixed && !isFixedHard ? "bg-white text-gray-600" : "border border-gray-300 hover:border-gray-300"} hover:cursor-pointer`}
                  onClick={() => setShowPopup((prev) => !prev)}
                >
                  <div className="w-[3rem] h-[3rem] rounded-full overflow-hidden">
                    <img
                      src={user.avatar || avatar_default}
                      alt="Avatar"
                      referrerPolicy="no-referrer"
                      className="w-full h-full rounded-full object-cover border border-gray-200"
                    />
                  </div>
                  <FontAwesomeIcon
                    icon={faAngleDown}
                    className="text-gray-500 hidden sm:block"
                  />
                </button>

                <AnimatePresence>
                  {showPopup && (
                    <motion.div
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="absolute top-[calc(100%+1.2rem)] right-0 w-[calc(100vw-3rem)] max-w-[35rem] md:max-w-[40rem] h-auto border border-gray-200 shadow-xl bg-gray-100 rounded-md z-[999]"
                    >
                      <div className="flex items-center gap-6 border-b border-b-gray-200 p-6 bg-white">
                        <img
                          src={user.avatar || avatar_default}
                          alt="Avatar"
                          referrerPolicy="no-referrer"
                          className="w-16 h-16 rounded-full object-cover shrink-0 border border-gray-200"
                        />
                        <div
                          className="text-start min-w-0 cursor-pointer"
                          onClick={() => {
                            navigate("/setting/profile");
                            setShowPopup(false);
                          }}
                        >
                          <h4 className="font-semibold truncate">
                            {user.fullName}
                          </h4>
                          <p className="text-[1.2rem] truncate">
                            {user.email ?? "Không có email"}
                          </p>
                        </div>
                      </div>
                      <div
                        className="p-6 text-gray-600 max-h-[55rem] overflow-y-auto"
                        style={{ scrollbarWidth: "none" }}
                      >
                        <div className="text-[1.4rem] font-semibold text-start px-5 py-2">
                          Tiện ích
                        </div>
                        <div className="text-start bg-white rounded-3xl">
                          {utilities.map((p, index) => {
                            const isNotify = p.title === "Thông báo";
                            return (
                              <div
                                key={p.id}
                                onClick={() => {
                                  navigate(p.link);
                                  setShowPopup(false);
                                }}
                                className={`flex items-center justify-between gap-2.5 px-8 py-6 hover:bg-gray-50 transition-colors duration-300 font-semibold hover:cursor-pointer ${index === utilities.length - 1 && "rounded-bl-3xl rounded-br-3xl"} ${index === 0 && "rounded-tl-3xl rounded-tr-3xl"}`}
                              >
                                <div className="flex items-center gap-4">
                                  <FontAwesomeIcon icon={p.icon} />
                                  <p>{p.title}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  {isNotify && unreadNotifications > 0 && (
                                    <span className="flex h-7 min-w-7 items-center justify-center rounded-full bg-red-500 px-1 text-[1.2rem] font-normal text-white">
                                      {unreadNotifications > 99
                                        ? "99+"
                                        : unreadNotifications}
                                    </span>
                                  )}
                                  <FontAwesomeIcon icon={faAngleRight} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        <div className="text-[1.4rem] mt-8 font-semibold text-start px-5 py-2">
                          Khác
                        </div>
                        <div className="text-start bg-white rounded-3xl">
                          {others.map((p, index) => {
                            const isLogout = p.title === "Đăng xuất";
                            return (
                              <div
                                key={p.id}
                                onClick={() => {
                                  if (p.link) {
                                    navigate(p.link);
                                  } else if (isLogout) {
                                    handleLogout();
                                  }
                                  setShowPopup(false);
                                }}
                                className={`flex items-center justify-between gap-2.5 px-8 py-6 hover:bg-gray-50 transition-colors duration-300 font-semibold ${p.color && p.color} hover:cursor-pointer ${index === others.length - 1 && "rounded-bl-3xl rounded-br-3xl"} ${index === 0 && "rounded-tl-3xl rounded-tr-3xl"}`}
                              >
                                <div className="flex items-center gap-4">
                                  <FontAwesomeIcon icon={p.icon} />
                                  <p>{p.title}</p>
                                </div>
                                <FontAwesomeIcon icon={faAngleRight} />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <button
                className="px-5 h-[4rem] rounded-full bg-orange-600 hover:bg-orange-500 transition-colors duration-300 text-white whitespace-nowrap"
                onClick={() => openAuthModal()}
              >
                Đăng nhập
              </button>
            )}
          </div>
        </div>

        {!isFixed && !isFixedHard && (
          <div className="absolute flex flex-col left-[50%] -translate-x-[50%] w-[92%] sm:w-[82%] md:w-[70%] xl:w-[60%] -bottom-[7rem] md:-bottom-[5rem] lg:-bottom-[4rem] bg-white item-shadow rounded-xl transition-discrete duration-300">
            <div className="absolute text-nowrap block xl:bottom-[calc(100%+5rem)] bottom-[calc(100%+2rem)] left-[50%] -translate-x-[50%] text-[1.8rem] md:text-[2.2rem] lg:text-[2.5rem] xl:text-[2.8rem] text-center text-white font-medium">
              Xe ưng ý đang chờ bạn đấy!
            </div>

            <form
              className="flex items-center w-full lg:h-[8rem] md:h-[7rem] h-[5rem] relative"
              onSubmit={(event) => {
                event.preventDefault();
                handleSearchMotor();
              }}
            >
              <button
                type="submit"
                aria-label="Tìm xe"
                className="absolute top-0 left-0 px-8 h-full text-gray-500 flex items-center justify-center"
              >
                <FontAwesomeIcon icon={faSearch} />
              </button>
              <input
                type="text"
                value={searchKeyword}
                onChange={(event) => setSearchKeyword(event.target.value)}
                className="flex-1 h-full outline-none pl-[5.5rem] pr-3 min-w-0"
                placeholder="Xin chào! Hôm này bạn cần tìm gì?"
              />
              <div className="relative flex items-center gap-2 sm:gap-5 justify-end pr-[1.5rem] sm:pr-[3rem] shrink-0">
                <div className="relative hidden lg:block" ref={elementAreaRef}>
                  <button
                    type="button"
                    className="flex items-center justify-between w-[20rem] h-[4.5rem] text-start rounded-md bg-white border border-gray-300 px-6 outline-none cursor-pointer"
                    onClick={() => setShowPopupArea((prev) => !prev)}
                  >
                    <span>Chọn khu vực</span>
                    <FontAwesomeIcon icon={faAngleDown} />
                  </button>
                  <AnimatePresence>
                    {showPopupArea && (
                      <ChooseAddress onClose={() => setShowPopupArea(false)} />
                    )}
                  </AnimatePresence>
                </div>
                <button
                  type="submit"
                  className="px-4 sm:px-6 h-[4rem] lg:h-[4.5rem] rounded-md bg-orange-400 hover:bg-orange-500 text-white transition-colors duration-300 text-nowrap"
                >
                  Tìm xe
                </button>
              </div>
            </form>

            <div
              className="lg:hidden border-t border-gray-100 px-4 py-3"
              ref={elementAreaMobileRef}
            >
              <button
                className="flex items-center justify-between w-full h-[4rem] text-start rounded-md bg-white border border-gray-300 px-6 outline-none text-gray-600 cursor-pointer"
                onClick={() => setShowPopupArea((prev) => !prev)}
              >
                <span>Chọn khu vực</span>
                <FontAwesomeIcon icon={faAngleDown} />
              </button>
              <AnimatePresence>
                {showPopupArea && (
                  <ChooseAddress onClose={() => setShowPopupArea(false)} />
                )}
              </AnimatePresence>
            </div>
          </div>
        )}

        <AnimatePresence>
          {isOpen && <LoginAndRegisterModal onClose={() => closeAuthModal()} />}
        </AnimatePresence>

        <AnimatePresence>
          {showMenuBar && (
            <>
              <div
                className="fixed w-full h-full inset-0 bg-[#42424267] z-[998]"
                onClick={() => setShowMenuBar(false)}
              ></div>
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ duration: 0.35, ease: "easeInOut" }}
                className="fixed inset-0 w-[80%] h-full z-[999] "
              >
                <div className="relative w-full h-full bg-white text-gray-600 z-[999]">
                  {user ? (
                    <div className="flex items-center gap-6 border-b border-b-gray-200 p-6 bg-white">
                      <img
                        src={user.avatar || avatar_default}
                        alt="Avatar"
                        referrerPolicy="no-referrer"
                        className="w-16 h-16 rounded-full object-cover shrink-0 border border-gray-200"
                      />
                      <div className="text-start min-w-0">
                        <h4 className="font-semibold truncate">
                          {user.fullName}
                        </h4>
                        <p className="text-[1.2rem] truncate">{user.email}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 border-b border-b-gray-200">
                      <button
                        className="w-full px-5 h-[4rem] rounded-full bg-orange-600 text-white"
                        onClick={() => {
                          openAuthModal();
                          setShowMenuBar(false);
                        }}
                      >
                        Đăng nhập
                      </button>
                    </div>
                  )}

                  <div className="space-y-12 py-10">
                    <div
                      className={`flex items-center justify-between gap-2.5 px-8 hover:bg-gray-50 transition-colors duration-300 font-semibold hover:cursor-pointer `}
                    >
                      <div className="flex items-center gap-4">
                        <p>Danh mục</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <FontAwesomeIcon icon={faAngleRight} />
                      </div>
                    </div>
                    <div
                      onClick={() => {
                        if (user) {
                          navigate("/posts/manage");
                        } else {
                          openAuthModal();
                        }
                        setShowMenuBar(false);
                      }}
                      className={`flex items-center justify-between gap-2.5 px-8 hover:bg-gray-50 transition-colors duration-300 font-semibold hover:cursor-pointer `}
                    >
                      <div className="flex items-center gap-4">
                        <p>Quản lý tin</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <FontAwesomeIcon icon={faAngleRight} />
                      </div>
                    </div>
                    <div
                      onClick={() => {
                        if (user) {
                          navigate("/messages");
                        } else {
                          openAuthModal();
                        }
                        setShowMenuBar(false);
                      }}
                      className={`flex items-center justify-between gap-2.5 px-8 hover:bg-gray-50 transition-colors duration-300 font-semibold hover:cursor-pointer `}
                    >
                      <div className="flex items-center gap-4">
                        <p>Tin nhắn</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </header>
    </>
  );
}

export default Header;
