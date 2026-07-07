import { faKey, faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import axiosInstance from "../../configs/axiosInstance";
import ValidatePassword from "../../utils/validatePassword";

function ResetPassword() {
  const navigate = useNavigate();
  const [resetEmail, setResetEmail] = useState<string>("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState({
    newPassword: false,
    confirmPassword: false,
  });
  const [errMessage, setErrMessage] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [isValidPass, setIsValidPass] = useState(false);
  const [canSubmit, setCanSubmit] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const email = sessionStorage.getItem("resetEmail");
    if (!email) {
      navigate("/");
      return;
    }
    setResetEmail(email);
  }, [navigate]);

  useEffect(() => {
    if (!confirmPassword) {
      setErrMessage((prev) => ({ ...prev, confirmPassword: "" }));
      return;
    }
    if (confirmPassword !== newPassword) {
      setErrMessage((prev) => ({
        ...prev,
        confirmPassword: "Mật khẩu xác nhận không khớp",
      }));
    } else {
      setErrMessage((prev) => ({ ...prev, confirmPassword: "" }));
    }
  }, [confirmPassword, newPassword]);

  useEffect(() => {
    const isMatch = newPassword === confirmPassword;
    setCanSubmit(!!(newPassword && confirmPassword && isValidPass && isMatch));
  }, [newPassword, confirmPassword, isValidPass]);

  const handleReset = async () => {
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
      toast.error("Mật khẩu không hợp lệ");
      return;
    }

    try {
      setIsSubmitting(true);
      await axiosInstance.post("/api/v1/auth/reset-password", {
        email: resetEmail,
        newPassword,
      });
      toast.success("Đặt lại mật khẩu thành công!");
      sessionStorage.removeItem("resetEmail");
      navigate("/");
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          "Đặt lại mật khẩu thất bại, vui lòng thử lại!",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full h-[100vh] flex items-start justify-center bg-gray-100">
      <div className="w-auto h-auto p-10 text-center flex flex-col items-center gap-8 mt-20 bg-white border border-gray-300 rounded-xl min-w-[420px]">
        <span className="w-20 h-20 rounded-full border-2 border-blue-500 flex items-center justify-center">
          <FontAwesomeIcon icon={faKey} className="text-blue-500 text-[2rem]" />
        </span>
        <div>
          <h5 className="text-[2.2rem]">Đặt lại mật khẩu</h5>
          <p className="text-gray-600">Tạo mật khẩu mới cho tài khoản</p>
          <p className="text-gray-600">{resetEmail}</p>
        </div>

        <div className="w-full flex flex-col gap-5 text-left">
          <div>
            <label className="text-gray-500">
              Mật khẩu mới <span className="text-red-500">*</span>
            </label>
            <div className="relative w-full h-[4.2rem]">
              <input
                type={showPassword.newPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                onFocus={() =>
                  setErrMessage((prev) => ({ ...prev, newPassword: "" }))
                }
                className="w-full h-full outline-none mt-2 pl-6 border border-gray-300 rounded-xl"
                placeholder="******"
              />
              <button
                type="button"
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

          <ValidatePassword
            password={newPassword}
            setIsValid={setIsValidPass}
          />

          <div>
            <label className="text-gray-500">
              Xác nhận mật khẩu <span className="text-red-500">*</span>
            </label>
            <div className="relative w-full h-[4.2rem]">
              <input
                type={showPassword.confirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onFocus={() =>
                  setErrMessage((prev) => ({ ...prev, confirmPassword: "" }))
                }
                className="w-full h-full outline-none mt-2 pl-6 border border-gray-300 rounded-xl"
                placeholder="******"
              />
              <button
                type="button"
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

        <button
          type="button"
          className={`w-full h-[4.2rem] ${
            canSubmit ? "bg-blue-500 hover:bg-blue-600" : "bg-gray-400"
          } text-white rounded-lg transition-colors hover:cursor-pointer`}
          onClick={handleReset}
          disabled={!canSubmit || isSubmitting}
        >
          {isSubmitting ? "Đang xử lý..." : "Đặt lại mật khẩu"}
        </button>
      </div>
    </div>
  );
}

export default ResetPassword;
