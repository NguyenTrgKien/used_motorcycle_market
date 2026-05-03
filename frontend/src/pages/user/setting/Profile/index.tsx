import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useUser } from "../../../../hooks/useUser";
import { faAdd, faAngleRight } from "@fortawesome/free-solid-svg-icons";
import { useForm } from "react-hook-form";
import logogg from "../../../../assets/images/google-logo.png";

interface UserInfoForm {
  fullName: string;
  birthday: string;
  gender: string;
  phone: string;
  email: string;
}

function Profile() {
  const { user } = useUser();
  const {
    control,
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<UserInfoForm>();

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
        <input
          type="text"
          name="phone"
          value={user.phone ?? ""}
          placeholder="Số điện thoại"
          className="w-full h-[4.6rem] rounded-xl border border-gray-300 px-8 outline-none"
        />
        <div className="w-full h-[4.6rem] flex items-center justify-between rounded-xl border border-gray-300 px-8 outline-none hover:cursor-pointer">
          <span className="text-gray-500">Địa chỉ</span>
          <button type="button">
            <FontAwesomeIcon icon={faAdd} className="text-gray-500" />
          </button>
        </div>
      </div>

      <h4 className="text-[2rem] font-medium mb-8 mt-10">Thông tin bảo mật</h4>
      <div className="space-y-5 mt-8">
        <input
          type="text"
          name="email"
          value={user.email ?? ""}
          placeholder="Email"
          className="w-full h-[4.6rem] rounded-xl border border-gray-300 px-8 outline-none"
        />
        <div className="w-full h-[4.6rem] flex items-center justify-between rounded-xl border border-gray-300 px-8 outline-none hover:cursor-pointer">
          <span className="text-gray-500">Đổi mật khẩu</span>
          <button type="button">
            <FontAwesomeIcon icon={faAngleRight} className="text-gray-500" />
          </button>
        </div>
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
    </div>
  );
}

export default Profile;
