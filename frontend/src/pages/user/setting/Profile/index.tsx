import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useUser } from "../../../../hooks/useUser";
import {
  faAdd,
  faAngleRight,
  faWarning,
} from "@fortawesome/free-solid-svg-icons";
import { useForm } from "react-hook-form";
import logogg from "../../../../assets/images/google-logo.png";
import { useState } from "react";
import SelectAddressModal from "../../../../components/SelectAddressModal";
import type { UserAddressType } from "../../../../types/address.type";
import { toast } from "react-toastify";
import axiosInstance from "../../../../configs/axiosInstance";
import { Link } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import ChangeEmailModal from "../../../../components/ChangeEmailModal";
import FullscreenLoader from "../../../../components/FullscreenLoader";
import ChangeContactModal from "../../../../components/ChangeContactModal/ChangeContactModal";

interface UserInfoForm {
  fullName: string;
  birthday: string;
  gender: string;
  phone: string;
  email: string;
}

function Profile() {
  const { user } = useUser();
  const [showSelectAddress, setShowSelectAddress] = useState(false);
  const [address, setAddress] = useState<UserAddressType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showChangeEmail, setShowChangeEmail] = useState(false);
  const [showContactModal, setShowContactModal] = useState<{
    open: boolean;
    type: "" | "email" | "phone";
  }>({
    open: false,
    type: "",
  });
  // const {
  //   control,
  //   register,
  //   handleSubmit,
  //   setValue,
  //   formState: { errors, isSubmitting },
  // } = useForm<UserInfoForm>();
  console.log(showContactModal);

  const handleSave = async () => {
    try {
      // const res = await axiosInstance.post()
    } catch (error: any) {
      toast.error(error?.response?.data?.message);
    }
  };

  return (
    <div className="p-[2rem]">
      <h4 className="text-[2rem] font-medium mb-8">Thông tin cơ bản</h4>
      <div className="space-y-6">
        <input
          type="text"
          name="fullName"
          value={user.fullName ?? ""}
          placeholder="Họ tên"
          className="w-full h-[4.6rem] rounded-xl border border-gray-300 px-8 outline-none"
        />
        <div className="flex items-center gap-6">
          <input
            type="text"
            name="birthday"
            value={user.birthday ?? ""}
            placeholder="Ngày sinh"
            className="w-full h-[4.6rem] rounded-xl border border-gray-300 px-8 outline-none"
          />
          <input
            type="text"
            name="gender"
            placeholder="Giới tính"
            value={user.gender ?? ""}
            className="w-full h-[4.6rem] rounded-xl border border-gray-300 px-8 outline-none"
          />
        </div>

        <div className="w-full h-[4.6rem] flex items-center justify-between rounded-xl border border-gray-300 px-8 outline-none hover:cursor-pointer">
          {user.phone ? (
            <div className="flex items-center justify-between w-full">
              <div className="text-gray-600">{user.phone}</div>
              <p
                className="text-blue-600"
                onClick={() =>
                  setShowContactModal({
                    open: true,
                    type: "phone",
                  })
                }
              >
                Thay đổi
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-between w-full">
              <span className="text-gray-500">Số điện thoại</span>
              <button
                type="button"
                className="block"
                onClick={() =>
                  setShowContactModal({
                    open: true,
                    type: "phone",
                  })
                }
              >
                <FontAwesomeIcon
                  icon={faAdd}
                  className="text-gray-500 hover:cursor-pointer"
                />
              </button>
            </div>
          )}
        </div>
        <div
          className="w-full h-[4.6rem] flex items-center justify-between rounded-xl border border-gray-300 px-8 outline-none hover:cursor-pointer"
          onClick={() => setShowSelectAddress(true)}
        >
          {address ? (
            <div className="flex items-center justify-between w-full">
              <div className="text-gray-600">
                {address.address}, {address.ward}, {address.province},
                {address.district}
              </div>
              <p className="text-blue-600">Mặt định</p>
            </div>
          ) : (
            <div className="flex items-center justify-between w-full">
              <span className="text-gray-500">Địa chỉ</span>
              <button type="button" className="block">
                <FontAwesomeIcon
                  icon={faAdd}
                  className="text-gray-500 hover:cursor-pointer"
                />
              </button>
            </div>
          )}
        </div>
      </div>

      <h4 className="text-[2rem] font-medium mb-8 mt-10">Thông tin bảo mật</h4>
      <div className="space-y-5 mt-8">
        <div className="w-full h-[4.6rem] flex items-center justify-between rounded-xl border border-gray-300 px-8 outline-none hover:cursor-pointer">
          <div className="flex items-center justify-between w-full">
            <div className="text-gray-600">{user.email}</div>
            {!user.isVerified ? (
              <p className="text-amber-500">
                <FontAwesomeIcon icon={faWarning} /> Hãy xác thực tài khoản
              </p>
            ) : (
              <p
                className="text-blue-600"
                onClick={() => {
                  setShowChangeEmail(true);
                }}
              >
                Đổi
              </p>
            )}
          </div>
        </div>
        {!user.googleId && (
          <Link
            to={"/setting/account"}
            className="w-full h-[4.6rem] flex items-center justify-between rounded-xl border border-gray-300 px-8 outline-none hover:cursor-pointer"
          >
            <span className="text-gray-500">Đổi mật khẩu</span>
            <button type="button">
              <FontAwesomeIcon icon={faAngleRight} className="text-gray-500" />
            </button>
          </Link>
        )}
        <div className="w-full h-[4.6rem] flex items-center justify-between rounded-xl border border-gray-300 px-8 outline-none hover:cursor-pointer">
          <div className="flex items-center gap-2">
            <img src={logogg} alt="logo google" className="w-10 h-10" />
            <span>Google</span>
          </div>
          {user?.googleId ? (
            <span className="text-green-600">Đã liên kết</span>
          ) : (
            <span className="text-gray-500">Chưa liên kết</span>
          )}
        </div>
      </div>
      <button
        type="button"
        className="inline-block px-5 py-3 rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition-colors duration-300 hover:cursor-pointer mt-10"
        onClick={handleSave}
        disabled={isLoading}
      >
        Lưu thay đổi
      </button>

      {showSelectAddress && (
        <SelectAddressModal
          setAddress={(address: UserAddressType) => setAddress(address)}
          onClose={() => setShowSelectAddress(false)}
        />
      )}

      <AnimatePresence>
        {showChangeEmail && (
          <ChangeEmailModal onClose={() => setShowChangeEmail(false)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showContactModal.open && (
          <ChangeContactModal
            type={showContactModal.type}
            onClose={() =>
              setShowContactModal({
                open: false,
                type: "",
              })
            }
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default Profile;
