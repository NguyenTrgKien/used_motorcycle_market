import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useUser } from "../../../../hooks/useUser";
import { faAdd, faAngleRight } from "@fortawesome/free-solid-svg-icons";
import { useForm, useWatch } from "react-hook-form";
import logogg from "../../../../assets/images/google-logo.png";
import { useState } from "react";
import SelectAddressModal from "../../../../components/SelectAddressModal";
import type { UserAddressType } from "../../../../types/address.type";
import { toast } from "react-toastify";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import ChangeEmailModal from "../../../../components/ChangeEmailModal";
import BirthdayModal from "../../../../components/BirthdayModal";
import GenderModal from "../../../../components/GenderModal";
import { updateUserBasic } from "../../../../apis/user.api";

export interface UserInfoForm {
  fullName: string;
  birthday: string;
  gender: string;
  personalInfo?: string;
}

function Profile() {
  const { user } = useUser();
  const navigate = useNavigate();
  const [showSelectAddress, setShowSelectAddress] = useState(false);
  const [address, setAddress] = useState<UserAddressType | null>(null);
  const [showChangeEmail, setShowChangeEmail] = useState(false);
  const [showBirthdayModal, setShowBirthdayModal] = useState(false);
  const [showGenderModal, setShowGenderModal] = useState(false);

  const {
    control,
    register,
    handleSubmit,
    setValue,
    formState: { isSubmitting },
  } = useForm<UserInfoForm>({
    defaultValues: {
      fullName: user.fullName ?? "",
      birthday: user.birthday ?? "",
      gender: user.gender ?? "",
      personalInfo: user.personalInfo ?? "",
    },
  });
  const birthdayValue = useWatch({ control, name: "birthday" });
  const genderValue = useWatch({ control, name: "gender" });

  const onSubmit = async (data: UserInfoForm) => {
    try {
      const res = (await updateUserBasic(data, user.id)) as any;
      toast.success(res.data.message);
    } catch (error: any) {
      toast.error(
        error.response.data.message ?? "Đã có lỗi xảy ra. Vui lòng thử lại!",
      );
      toast.error(error?.response?.data?.message);
    }
  };

  const handleRedirectSecurity = () => {
    navigate("/setting/security");
  };

  return (
    <div className="p-[2rem]">
      <h4 className="text-[2rem] font-medium mb-8">Thông tin cơ bản</h4>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-6">
          <input
            type="text"
            placeholder="Họ tên"
            className="w-full h-[4.6rem] rounded-xl border border-gray-300 px-8 outline-none"
            {...register("fullName")}
          />
          <div className="flex items-center gap-6">
            <div
              className="w-full h-[4.6rem] flex items-center justify-between rounded-xl border border-gray-300 px-8 outline-none hover:cursor-pointer bg-white"
              onClick={() => setShowBirthdayModal(true)}
            >
              <span
                className={`flex-1 ${user.birthday ? "text-gray-800" : "text-gray-500"}`}
              >
                {birthdayValue
                  ? new Intl.DateTimeFormat("vi-VN", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    }).format(new Date(birthdayValue))
                  : "Ngày sinh"}
              </span>
              <FontAwesomeIcon icon={faAngleRight} className="text-gray-400" />
            </div>
            <div
              className="w-full h-[4.6rem] flex items-center justify-between rounded-xl border border-gray-300 px-8 outline-none hover:cursor-pointer bg-white"
              onClick={() => setShowGenderModal(true)}
            >
              <span
                className={`flex-1 ${genderValue ? "text-gray-800" : "text-gray-500"}`}
              >
                {genderValue
                  ? genderValue === "male"
                    ? "Nam"
                    : genderValue === "female"
                      ? "Nữ"
                      : "Khác"
                  : "Giới tính"}
              </span>
              <FontAwesomeIcon icon={faAngleRight} className="text-gray-400" />
            </div>
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
                <span className="text-gray-500">
                  {user?.addresses?.length > 0
                    ? user.addresses.map((add: UserAddressType) => {
                        return (
                          <span>
                            {add.address}, {add.ward}, {add.district},{" "}
                            {add.province}
                          </span>
                        );
                      })
                    : "Địa chỉ"}
                </span>
                <button type="button" className="block hover:cursor-pointer">
                  {user?.addresses.length > 0 ? (
                    <span className="text-blue-500 hover:text-blue-700 transition-colors">
                      Thay đổi
                    </span>
                  ) : (
                    <FontAwesomeIcon
                      icon={faAdd}
                      className="text-gray-500 hover:cursor-pointer"
                    />
                  )}
                </button>
              </div>
            )}
          </div>

          <textarea
            name="intro"
            placeholder="Giới thiệu (mô tả ngắn về bản thân)"
            value={user.gender ?? ""}
            rows={3}
            className="w-full rounded-xl border border-gray-300 py-4 px-8 outline-none"
          />
        </div>

        <button
          type="submit"
          className="inline-block px-5 py-3 rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition-colors duration-300 hover:cursor-pointer mt-5 outline-none"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Đang xử lý..." : "Lưu thay đổi"}
        </button>
      </form>

      <h4 className="text-[2rem] font-medium mb-8 mt-10">Thông tin bảo mật</h4>
      <div className="space-y-5 mt-8">
        <div className="w-full h-[4.6rem] flex items-center justify-between rounded-xl border border-gray-300 px-8 outline-none ">
          <div className="text-gray-600">{user?.email}</div>
        </div>

        <div className="w-full h-[4.6rem] flex items-center justify-between rounded-xl border border-gray-300 px-8 outline-none ">
          {!user?.phone ? (
            <div className="text-gray-600">{user?.phone}</div>
          ) : (
            <div className="flex items-center justify-between w-full text-gray-500">
              <span>Số điện thoại</span>
              <button type="button" className="block">
                Chưa liên kết
              </button>
            </div>
          )}
        </div>

        {!user.isGoogleLinked && (
          <Link
            to={"/setting/account"}
            className="w-full h-[4.6rem] flex items-center justify-between rounded-xl border border-gray-300 px-8 outline-none "
          >
            <span className="text-gray-500">Đổi mật khẩu</span>
            <button type="button">
              <FontAwesomeIcon icon={faAngleRight} className="text-gray-500" />
            </button>
          </Link>
        )}
        <div className="w-full h-[4.6rem] flex items-center justify-between rounded-xl border border-gray-300 px-8 outline-none ">
          <div className="flex items-center gap-2">
            <img src={logogg} alt="logo google" className="w-10 h-10" />
            <span>Google</span>
          </div>
          {user?.isGoogleLinked ? (
            <span className="text-green-600">Đã liên kết</span>
          ) : (
            <span className="text-gray-500">Chưa liên kết</span>
          )}
        </div>

        <button
          type="button"
          className="flex items-center justify-center px-5 py-3 rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition-colors duration-300 hover:cursor-pointer mt-10 outline-none"
          disabled={isSubmitting}
          onClick={handleRedirectSecurity}
        >
          <span>Quản lý bảo mật</span>
          <FontAwesomeIcon icon={faAngleRight} />
        </button>
      </div>

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
        {showBirthdayModal && (
          <BirthdayModal
            onClose={() => setShowBirthdayModal(false)}
            setValue={setValue}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showGenderModal && (
          <GenderModal
            onClose={() => setShowGenderModal(false)}
            setValue={setValue}
            initialGender={genderValue}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default Profile;
