import {
  faAngleLeft,
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
import { useGetSecurity } from "./api/useGetSecurity";

function Account() {
  const { user } = useUser();
  const { data: responseSecurity } = useGetSecurity();
  const dataSecurity = responseSecurity?.security;
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
  const [isSubmitForgotPass, setIsSubmitForgotPass] = useState(false);

  const resetErr = () => {
    return setErrMessage({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
  };

  useEffect(() => {
    if (!confirmPassword) {
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
    const isPasswordMatch = confirmPassword === newPassword;

    if (user.hasPassword) {
      setIsSubmit(
        !!(
          currentPassword &&
          newPassword &&
          confirmPassword &&
          isValidPass &&
          isPasswordMatch
        ),
      );
    } else {
      setIsSubmit(
        !!(newPassword && confirmPassword && isValidPass && isPasswordMatch),
      );
    }
  }, [
    user.hasPassword,
    currentPassword,
    newPassword,
    confirmPassword,
    isValidPass,
  ]);

  const handleChangePassword = async () => {
    if (user.hasPassword && !currentPassword) {
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
      let res;
      if (user.hasPassword) {
        res = await axiosInstance.patch("/api/v1/auth/change-password", {
          currentPassword,
          newPassword,
        });
      } else {
        res = await axiosInstance.post("/api/v1/auth/add-password", {
          newPassword,
        });
      }
      toast.success(
        res.data.message ??
          (user.hasPassword
            ? "Đổi mật khẩu thành công"
            : "Thêm mật khẩu thành công"),
      );
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      queryClient.invalidateQueries({ queryKey: ["user"] });
      if (user.hasPassword) {
        openAuthModal();
        navigate("/");
      }
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || "Đã có lỗi xảy ra. Vui lòng thử lại",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    try {
      setIsSubmitForgotPass(true);
      await axiosInstance.post("/api/v1/auth/forgot-password", {
        email: user.email,
      });
      sessionStorage.setItem("otpMode", "forgot_password");
      sessionStorage.setItem("forgotPassword", user.email);
      navigate("/verify-otp");
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ?? "Có lỗi xảy ra! Vui lòng thử lại.",
      );
    } finally {
      setIsSubmitForgotPass(false);
    }
  };

  return (
    <div className="p-[2rem]">
      <div className="flex items-center gap-5 mb-5">
        <button
          className="w-12 h-12 rounded-lg bg-gray-200 hover:bg-gray-300 border-2 border-gray-300"
          onClick={() => navigate(-1)}
        >
          <FontAwesomeIcon icon={faAngleLeft} className="text-gray-700" />
        </button>
        <h4 className="text-[2rem] font-medium">
          {user.hasPassword ? "Thay đổi mật khẩu" : "Tạo mật khẩu"}
        </h4>
      </div>
      {!user?.email ? (
        <div className="mb-5 p-5 bg-orange-50 font-extralight text-amber-800">
          <FontAwesomeIcon icon={faWarning} className="pr-3" />
          Hãy thêm email trước khi thực hiện thao tác này
        </div>
      ) : (
        !dataSecurity?.isVerified && (
          <div className="mb-5 p-5 bg-orange-50 font-extralight text-amber-800">
            <FontAwesomeIcon icon={faWarning} className="pr-3" />
            Hãy xác thực tài khoản trước khi thực hiện thao tác này
          </div>
        )
      )}
      <div className="space-y-8">
        {user.hasPassword && (
          <div>
            <label htmlFor="newPassword" className="text-gray-500">
              Mật khẩu hiện tại <span className="text-red-500">*</span>
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
        )}
        <div>
          <label htmlFor="newPassword" className="text-gray-500">
            {user.hasPassword ? "Mật khẩu mới" : "Nhập mật khẩu"}{" "}
            <span className="text-red-500">*</span>
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
      <div className="flex items-center justify-between mt-10">
        <button
          className={`px-5 py-3 rounded-lg text-white ${!isSubmit ? "opacity-50 cursor-not-allowed bg-gray-400" : "bg-blue-500 hover:bg-blue-600"} transition-colors hover:cursor-pointer`}
          onClick={handleChangePassword}
          disabled={!isSubmit || isLoading}
        >
          {isLoading
            ? "Đang xử lý..."
            : user.hasPassword
              ? "Đổi mật khẩu"
              : "Tạo mật khẩu"}
        </button>
        {dataSecurity?.isVerified && (
          <button
            className="text-blue-500 hover:text-blue-600 transition-colors hover:cursor-pointer"
            onClick={handleForgotPassword}
            disabled={isSubmitForgotPass}
          >
            {isSubmitForgotPass ? "Đang xử lý..." : "Quên mật khẩu?"}
          </button>
        )}
      </div>

      {isLoading && <FullscreenLoader />}
    </div>
  );
}

export default Account;
