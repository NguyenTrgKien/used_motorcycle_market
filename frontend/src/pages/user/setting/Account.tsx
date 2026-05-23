import {
  faEye,
  faEyeSlash,
  faWarning,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useState } from "react";
import { useUser } from "../../../hooks/useUser";
import ValidatePassword from "../../../utils/validatePassword";
import { toast } from "react-toastify";
import axiosInstance from "../../../configs/axiosInstance";
import FullscreenLoader from "../../../components/FullscreenLoader";
import { useQueryClient } from "@tanstack/react-query";
import useAuthModal from "../../../hooks/useAuthModal";
import { useNavigate } from "react-router-dom";

function Account() {
  const { user } = useUser();
  const { openAuthModal } = useAuthModal();
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });
  const [errMessage, setErrMessage] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isSubmit, setIsSubmit] = useState(false);
  const [isValidPass, setIsValidPass] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();
  const resetErr = () => {
    return setErrMessage({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
  };

  useEffect(() => {
    if (!confirmPassword) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setErrMessage((prev) => ({
        ...prev,
        confirmPassword: "",
      }));
      return;
    }
    if (confirmPassword !== newPassword) {
      setErrMessage((prev) => ({
        ...prev,
        confirmPassword: "Mật khẩu xác nhận không khớp",
      }));
    } else {
      setErrMessage((prev) => ({
        ...prev,
        confirmPassword: "",
      }));
    }
  }, [confirmPassword, newPassword]);

  useEffect(() => {
    if (
      currentPassword &&
      newPassword &&
      confirmPassword &&
      isValidPass &&
      confirmPassword === newPassword
    ) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsSubmit(true);
    } else {
      setIsSubmit(false);
    }
  }, [currentPassword, newPassword, confirmPassword, isValidPass]);

  const handleChangePassword = async () => {
    if (!currentPassword) {
      setErrMessage((prev) => ({
        ...prev,
        currentPassword: "Vui lòng nhập mật khẩu hiện tại",
      }));
      return;
    }
    if (!newPassword) {
      setErrMessage((prev) => ({
        ...prev,
        newPassword: "Vui lòng nhập mật khẩu mới",
      }));
      return;
    }
    if (!confirmPassword) {
      setErrMessage((prev) => ({
        ...prev,
        confirmPassword: "Vui lòng nhập lại mật khẩu",
      }));
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrMessage((prev) => ({
        ...prev,
        confirmPassword: "Mật khẩu xác nhận không khớp",
      }));
      return;
    }
    if (!isValidPass) {
      toast.error("Mật khẩu mới không hợp lệ");
      return;
    }
    setIsLoading(true);
    try {
      const res = await axiosInstance.patch("/api/v1/auth/change-password", {
        currentPassword,
        newPassword,
      });
      toast.success(res.data.message || "Đổi mật khẩu thành công");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      queryClient.invalidateQueries({ queryKey: ["user"] });
      navigate("/");
      openAuthModal();
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || "Đã có lỗi xảy ra. Vui lòng thử lại",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-[2rem]">
      <h4 className="text-[2rem] font-medium mb-5">Thay đổi mật khẩu</h4>
      {!user?.email ? (
        <div className="mb-5 p-5 bg-orange-50 font-extralight text-amber-800">
          <FontAwesomeIcon icon={faWarning} className="pr-3" />
          Hãy thêm email trước khi thực hiện thao tác này
        </div>
      ) : (
        !user.isVerified && (
          <div className="mb-5 p-5 bg-orange-50 font-extralight text-amber-800">
            <FontAwesomeIcon icon={faWarning} className="pr-3" />
            Hãy xác thực tài khoản trước khi thực hiện thao tác này
          </div>
        )
      )}
      <div className="space-y-8">
        <div>
          <label htmlFor="newPassword" className="text-gray-500">
            Mật khẩu hiện tại *
          </label>
          <div className="relative w-full h-[4.2rem]">
            <input
              type={showPassword.currentPassword ? "text" : "password"}
              value={currentPassword}
              onChange={(e) => {
                setCurrentPassword(e.target.value);
              }}
              className="w-full h-full outline-none mt-2 pl-6 border border-gray-300 rounded-xl"
              placeholder="******"
              onFocus={() => resetErr()}
            />
            <button
              className="absolute top-[50%] right-6 -translate-y-[50%] cursor-pointer text-gray-600"
              onClick={() =>
                setShowPassword((prev) => ({
                  ...prev,
                  currentPassword: !prev.currentPassword,
                }))
              }
            >
              <FontAwesomeIcon
                icon={showPassword.currentPassword ? faEye : faEyeSlash}
              />
            </button>
          </div>
          <p className="text-[1.4rem] text-red-500 mt-2">
            {errMessage.currentPassword}
          </p>
        </div>
        <div>
          <label htmlFor="newPassword" className="text-gray-500">
            Mật khẩu mới *
          </label>
          <div className="relative w-full h-[4.2rem]">
            <input
              type={showPassword.newPassword ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full h-full outline-none mt-2 pl-6 border border-gray-300 rounded-xl"
              placeholder="******"
              onFocus={() => resetErr()}
            />
            <button
              className="absolute top-[50%] right-6 -translate-y-[50%] cursor-pointer text-gray-600"
              onClick={() =>
                setShowPassword((prev) => ({
                  ...prev,
                  newPassword: !prev.newPassword,
                }))
              }
            >
              <FontAwesomeIcon
                icon={showPassword.newPassword ? faEye : faEyeSlash}
              />
            </button>
          </div>
          <p className="text-[1.4rem] text-red-500 mt-2">
            {errMessage.newPassword}
          </p>
        </div>

        <ValidatePassword password={newPassword} setIsValid={setIsValidPass} />

        <div>
          <label htmlFor="confirmPassword" className="text-gray-500">
            Xác nhận mật khẩu *
          </label>
          <div className="relative w-full h-[4.2rem]">
            <input
              type={showPassword.confirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full h-full outline-none mt-2 pl-6 border border-gray-300 rounded-xl"
              placeholder="******"
              onFocus={() => resetErr()}
            />
            <button
              className="absolute top-[50%] right-6 -translate-y-[50%] cursor-pointer text-gray-600"
              onClick={() =>
                setShowPassword((prev) => ({
                  ...prev,
                  confirmPassword: !prev.confirmPassword,
                }))
              }
            >
              <FontAwesomeIcon
                icon={showPassword.confirmPassword ? faEye : faEyeSlash}
              />
            </button>
          </div>
          <p className="text-[1.4rem] text-red-500 mt-2">
            {errMessage.confirmPassword}
          </p>
        </div>
      </div>
      <div className="flex mt-10">
        <button
          className={`px-5 py-3 rounded-lg text-white ${!isSubmit ? "opacity-50 cursor-not-allowed bg-gray-400" : "bg-blue-500 hover:bg-blue-600"} transition-colors hover:cursor-pointer`}
          onClick={handleChangePassword}
          disabled={!isSubmit || isLoading}
        >
          {isLoading ? "Đang xử lý..." : "Đổi mật khẩu"}
        </button>
      </div>

      {isLoading && <FullscreenLoader />}
    </div>
  );
}

export default Account;
