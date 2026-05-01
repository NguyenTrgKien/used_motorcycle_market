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
import HeaderBanner from "../components/HeaderBanner";
import LoginAndRegisterModal from "../components/auth/Login&RegisterModal";
import { useUser } from "../hooks/useUser";
import { useAuth } from "../hooks/useAuth";
import ChooseAddress from "../components/ChooseAdress";
import useAuthModal from "../hooks/useAuthModal";

const utilities = [
  { id: 1, title: "Tin đăng đã lưu", icon: faHeart, link: "/saved-posts" },
  {
    id: 2,
    title: "Tìm kiếm đã lưu",
    icon: faMagnifyingGlass,
    link: "/saved-searches",
  },
  {
    id: 3,
    title: "Thông báo",
    icon: faMagnifyingGlass,
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
  const { isOpen, openAuthModal, closeAuthModal } = useAuthModal();
  const location = useLocation();
  const isFixedHard = location.pathname.startsWith("/setting");
  const [showPopup, setShowPopup] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);
  const elementAreaRef = useRef<HTMLDivElement>(null);
  const elementAreaMobileRef = useRef<HTMLDivElement>(null);
  const [isFixed, setIsFixed] = useState(false);
  const [showPopupArea, setShowPopupArea] = useState(false);
  const [showMenuBar, setShowMenuBar] = useState(false);

  useEffect(() => {
    const handleClickOutSide = (e: MouseEvent) => {
      if (
        elementRef.current &&
        !elementRef.current.contains(e.target as Node)
      ) {
        setShowPopup(false);
      }
      if (
        elementAreaRef.current &&
        !elementAreaRef.current.contains(e.target as Node) &&
        elementAreaMobileRef.current &&
        !elementAreaMobileRef.current.contains(e.target as Node)
      ) {
        setShowPopupArea(false);
      }
    };
    document.addEventListener("click", handleClickOutSide);
    return () => document.removeEventListener("click", handleClickOutSide);
  }, []);

  useEffect(() => {
    const handleScroll = () => setIsFixed(window.scrollY > 150);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = async () => await logout();

  const handleSearchMotor = () => {};

  return (
    <>
      <div
        className={`${isFixed && isFixedHard ? "md:h-[15rem]" : "hidden"}`}
      ></div>
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
            <div className="hidden md:flex items-center gap-1 cursor-pointer">
              <FontAwesomeIcon icon={faTableCells} className="text-[1.8rem]" />
              <span>Danh mục</span>
            </div>
          </div>

          {(isFixed || isFixedHard) && (
            <div className="hidden sm:flex flex-1 mx-4 md:mx-6 max-w-[45rem] h-[4rem] relative">
              <input
                type="text"
                className="w-full h-full border border-gray-300 rounded-full focus:border-orange-500 outline-none pl-[2rem] pr-[5rem]"
                placeholder="Xin chào! Hôm này bạn cần tìm gì?"
              />
              <button className="absolute top-0 right-0 w-[5rem] h-[4rem] flex items-center justify-center cursor-pointer text-gray-500">
                <FontAwesomeIcon icon={faSearch} />
              </button>
            </div>
          )}

          <div className="flex items-center gap-4 sm:gap-6 shrink-0">
            <button className="relative hidden sm:block cursor-pointer">
              <FontAwesomeIcon icon={faHeart} className="text-[2.2rem]" />
            </button>
            <button className="relative cursor-pointer">
              <FontAwesomeIcon icon={faBell} className="text-[2.2rem]" />
              <span className="absolute -top-3 -right-3 w-6 h-6 flex items-center justify-center text-[1rem] text-white bg-red-500 rounded-full">
                1
              </span>
            </button>
            <button
              className={`hidden lg:flex items-center gap-1 px-5 h-[4rem] rounded-full ${!isFixed && !isFixedHard ? "bg-white text-gray-600" : "border border-gray-300"} hover:cursor-pointer`}
            >
              <FontAwesomeIcon icon={faCommentDots} />
              <span>Liên hệ</span>
            </button>
            <button
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
                      src={user.avatar ?? avatar_default}
                      alt="Avatar"
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
                          src={user.avatar ?? avatar_default}
                          alt="Avatar"
                          className="w-16 h-16 rounded-full object-cover shrink-0 border border-gray-200"
                        />
                        <div className="text-start min-w-0">
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
                                className={`flex items-center justify-between gap-2.5 px-8 py-6 hover:bg-gray-50 transition-colors duration-300 font-semibold hover:cursor-pointer ${index === utilities.length - 1 && "rounded-bl-3xl rounded-br-3xl"} ${index === 0 && "rounded-tl-3xl rounded-tr-3xl"}`}
                              >
                                <div className="flex items-center gap-4">
                                  <FontAwesomeIcon icon={p.icon} />
                                  <p>{p.title}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  {isNotify && (
                                    <span className="w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center text-[1.2rem] font-normal">
                                      1
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

            <div className="flex items-center w-full lg:h-[8rem] md:h-[7rem] h-[5rem] relative">
              <button className="absolute top-0 left-0 px-8 h-full text-gray-500 flex items-center justify-center">
                <FontAwesomeIcon icon={faSearch} />
              </button>
              <input
                type="text"
                className="flex-1 h-full outline-none pl-[5.5rem] pr-3 min-w-0"
                placeholder="Xin chào! Hôm này bạn cần tìm gì?"
              />
              <div className="relative flex items-center gap-2 sm:gap-5 justify-end pr-[1.5rem] sm:pr-[3rem] shrink-0">
                <div className="relative hidden lg:block" ref={elementAreaRef}>
                  <button
                    className="flex items-center justify-between w-[20rem] h-[4.5rem] text-start rounded-md bg-white border border-gray-300 px-6 outline-none cursor-pointer"
                    onClick={() => setShowPopupArea((prev) => !prev)}
                  >
                    <span>Chọn khu vực</span>
                    <FontAwesomeIcon icon={faAngleDown} />
                  </button>
                  <AnimatePresence>
                    {showPopupArea && <ChooseAddress />}
                  </AnimatePresence>
                </div>
                <button
                  className="px-4 sm:px-6 h-[4rem] lg:h-[4.5rem] rounded-md bg-orange-400 hover:bg-orange-500 text-white transition-colors duration-300 text-nowrap"
                  onClick={handleSearchMotor}
                >
                  Tìm xe
                </button>
              </div>
            </div>

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
                {showPopupArea && <ChooseAddress />}
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
                  <div className="flex items-center gap-6 border-b border-b-gray-200 p-6 bg-white">
                    <img
                      src={user.avatar ?? avatar_default}
                      alt="Avatar"
                      className="w-16 h-16 rounded-full object-cover shrink-0 border border-gray-200"
                    />
                    <div className="text-start min-w-0">
                      <h4 className="font-semibold truncate">
                        {user.fullName}
                      </h4>
                      <p className="text-[1.2rem] truncate">{user.email}</p>
                    </div>
                  </div>

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
                      className={`flex items-center justify-between gap-2.5 px-8 hover:bg-gray-50 transition-colors duration-300 font-semibold hover:cursor-pointer `}
                    >
                      <div className="flex items-center gap-4">
                        <p>Liên hệ</p>
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
