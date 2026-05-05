import {
  faCircleUser,
  faClock,
  faEdit,
  faHeart,
  faLocationDot,
  faReceipt,
  faShield,
  faUnlock,
  faUserGroup,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useUser } from "../../../hooks/useUser";
import { useState } from "react";
import ChangeAvatarModal from "../../../components/ChangeAvatarModal";
import { AnimatePresence } from "framer-motion";

const settingMenus = [
  {
    id: 1,
    title: "Thông tin cá nhân",
    icon: faCircleUser,
    link: "profile",
  },
  {
    id: 2,
    title: "Mạng xã hội",
    icon: faUserGroup,
    link: "social",
  },
  {
    id: 3,
    title: "Tin đăng của tôi",
    icon: faReceipt,
    link: "account",
  },
  {
    id: 4,
    title: "Địa chỉ",
    icon: faLocationDot,
    link: "address",
  },
  {
    id: 5,
    title: "Tin đã lưu",
    icon: faHeart,
    link: "save-listing",
  },
  {
    id: 6,
    title: "Quản lý lịch sử đăng nhập",
    icon: faClock,
    link: "login-tracking",
  },
];

function Setting() {
  const { user, isLoading } = useUser();
  const [showChangeAvatar, setShowChangeAvatar] = useState(false);
  const location = useLocation();
  const path = location.pathname;
  const lastSegment = path.split("/").filter(Boolean).pop();

  return (
    <div className="flex gap-[2rem] pt-[8.5rem] px-[15rem]">
      <div className="w-[30rem] h-auto border border-gray-200 rounded-xl bg-white p-[2rem]">
        {isLoading ? (
          <div className="text-center pb-[2rem] mb-[2rem] border-b border-b-gray-200">
            <div className="w-[6rem] h-[6rem] rounded-full bg-gray-200 animate-pulse mx-auto" />
            <div className="h-[1.6rem] w-[12rem] bg-gray-200 animate-pulse rounded-md mt-2 mx-auto" />
            <div className="h-[1.4rem] w-[9rem] bg-gray-200 animate-pulse rounded-md mt-2 mx-auto" />
            <div className="flex justify-center mt-2">
              <div className="h-[3rem] w-[10rem] bg-gray-200 animate-pulse rounded-xl" />
            </div>
          </div>
        ) : (
          <div className="text-center pb-[2rem] mb-[2rem] border-b border-b-gray-200">
            <div className="relative w-[7rem] h-[7rem] mx-auto">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={`avatar-${user.fullName}`}
                  referrerPolicy="no-referrer"
                  className="w-full h-full rounded-full object-cover border border-gray-200 mx-auto"
                />
              ) : (
                <div className="w-full h-full rounded-full flex items-center justify-center bg-cyan-200 text-blue-800 font-semibold  mx-auto">
                  NT
                </div>
              )}
              <button
                className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:cursor-pointer"
                onClick={() => setShowChangeAvatar(true)}
              >
                <FontAwesomeIcon icon={faEdit} className="text-[1.2rem]" />
              </button>
            </div>
            <p className="mt-2">{user.fullName}</p>
            <p>{user.phone}</p>
            <div className="flex justify-center">
              <span className="block px-6 py-2 text-[1.4rem] bg-green-100 text-green-700 rounded-full mt-2">
                Chưa xác minh
              </span>
            </div>
          </div>
        )}
        <div>
          <h4 className="font-medium text-gray-500 mb-2">Cá nhân</h4>
          {settingMenus.map((item) => {
            return (
              <Link
                to={item.link}
                key={item.id}
                className={`flex items-center gap-4 py-6 px-5 ${lastSegment === item.link ? "bg-gray-100" : ""} rounded-lg hover:cursor-pointer text-gray-500`}
              >
                <FontAwesomeIcon icon={item.icon} className="text-[1.8rem]" />
                <span>{item.title}</span>
              </Link>
            );
          })}
          <h4 className="font-medium text-gray-500 mb-2 mt-[2rem]">Bảo mật</h4>
          <div>
            <Link
              to={""}
              className={`flex items-center gap-4 py-6 px-5 ${lastSegment === "change-password" ? "bg-gray-100" : ""} rounded-lg hover:cursor-pointer text-gray-500`}
            >
              <FontAwesomeIcon icon={faUnlock} className="text-[1.8rem]" />
              <span>Cài đặt tài khoản</span>
            </Link>
            <Link
              to={""}
              className={`flex items-center gap-4 py-6 px-5 ${lastSegment === "security" ? "bg-gray-100" : ""} rounded-lg hover:cursor-pointer text-gray-500`}
            >
              <FontAwesomeIcon icon={faShield} className="text-[1.8rem]" />
              <span>Bảo mật & quyền riêng tư</span>
            </Link>
          </div>
        </div>
      </div>
      <div className="w-full flex-1 h-auto border border-gray-200 bg-white rounded-xl">
        <Outlet />
      </div>

      <AnimatePresence>
        {showChangeAvatar && (
          <ChangeAvatarModal onClose={() => setShowChangeAvatar(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}

export default Setting;
