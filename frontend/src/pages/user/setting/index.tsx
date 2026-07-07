import {
  faCircleUser,
  faClock,
  faEdit,
  faHeart,
  faKey,
  faLocationDot,
  faShield,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import ChangeAvatarModal from "../../../components/ChangeAvatarModal";
import FullscreenLoader from "../../../components/FullscreenLoader";
import axiosInstance from "../../../configs/axiosInstance";
import { useUser } from "../../../hooks/useUser";
import { useGetSecurity } from "./api/useGetSecurity";

const personalMenus = [
  {
    id: 1,
    title: "Thông tin cá nhân",
    icon: faCircleUser,
    link: "profile",
  },
  {
    id: 2,
    title: "Địa chỉ",
    icon: faLocationDot,
    link: "address",
  },
  {
    id: 3,
    title: "Tin đã lưu",
    icon: faHeart,
    link: "save-listing",
  },
];

const securityMenus = [
  {
    id: 1,
    title: "Bảo mật & quyền riêng tư",
    icon: faShield,
    link: "security",
  },
  {
    id: 2,
    title: "Mật khẩu",
    icon: faKey,
    link: "security/password",
  },
  {
    id: 3,
    title: "Lịch sử đăng nhập",
    icon: faClock,
    link: "login-tracking",
  },
];

function Setting() {
  const { user, isLoading } = useUser();
  const [showChangeAvatar, setShowChangeAvatar] = useState(false);
  const [isResend, setIsResend] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const currentSettingPath =
    location.pathname.replace(/^\/setting\/?/, "") || "profile";

  const { data: responseSecurity } = useGetSecurity();
  const dataSecurity = responseSecurity?.security;

  const isMenuActive = (link: string) => currentSettingPath === link;

  const handleSendOtp = async () => {
    try {
      setIsResend(true);
      await axiosInstance.post("/api/v1/auth/resend-verification-otp");
      navigate("/verify-otp");
      sessionStorage.setItem("pendingVerify", "true");
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ||
          "Gửi mã thất bại, vui lòng thử lại sau",
      );
    } finally {
      setIsResend(false);
    }
  };

  return (
    <div className="flex gap-[2rem] pt-[8.5rem] px-[10rem]">
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
                <div className="w-full h-full rounded-full flex items-center justify-center bg-cyan-200 text-blue-800 font-semibold mx-auto">
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
            <p>{user.phone || "Chưa liên kết số điện thoại"}</p>
            <div className="flex justify-center">
              {dataSecurity?.isVerified ? (
                <span className="block px-6 py-2 text-[1.4rem] bg-green-100 text-green-700 rounded-full mt-2">
                  Đã xác minh
                </span>
              ) : (
                <button
                  type="button"
                  className="block px-6 py-2 text-[1.4rem] bg-amber-100 text-amber-700 rounded-full mt-2 hover:bg-amber-200 transition-colors hover:cursor-pointer"
                  onClick={handleSendOtp}
                >
                  Xác thực ngay
                </button>
              )}
            </div>
          </div>
        )}
        <div>
          <h4 className="font-medium text-gray-500 mb-2">Cá nhân</h4>
          {personalMenus.map((item) => (
            <Link
              to={item.link}
              key={item.id}
              className={`flex items-center gap-4 py-6 px-5 ${isMenuActive(item.link) ? "bg-gray-100" : ""} rounded-lg hover:cursor-pointer text-gray-500`}
            >
              <FontAwesomeIcon icon={item.icon} className="text-[1.8rem]" />
              <span>{item.title}</span>
            </Link>
          ))}
          <h4 className="font-medium text-gray-500 mb-2 mt-[2rem]">Bảo mật</h4>
          {securityMenus.map((item) => (
            <Link
              to={item.link}
              key={item.id}
              className={`flex items-center gap-4 py-6 px-5 ${isMenuActive(item.link) ? "bg-gray-100" : ""} rounded-lg hover:cursor-pointer text-gray-500`}
            >
              <FontAwesomeIcon icon={item.icon} className="text-[1.8rem]" />
              <span>{item.title}</span>
            </Link>
          ))}
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

      {isResend && <FullscreenLoader />}
    </div>
  );
}

export default Setting;
