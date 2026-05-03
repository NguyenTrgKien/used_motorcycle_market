import {
  faAngleLeft,
  faCheck,
  faEye,
  faEyeSlash,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";
import axiosInstance from "../../configs/axiosInstance";

interface ForgotPassProps {
  setStep: (value: "form" | "otp" | "forgot") => void;
}

type stepForgot = "email" | "otp" | "reset" | "complete";

function ForgotPass({ setStep }: ForgotPassProps) {
  const [stepForgot, setStepForgot] = useState<stepForgot>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errMessage, setErrMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState({
    newPassword: false,
    confirmPassword: false,
  });
  const [errMessageReset, setErrMessageReset] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const prevStep: Record<stepForgot, stepForgot | "form"> = {
    email: "form",
    otp: "email",
    reset: "otp",
    complete: "form",
  };

  const handleSendOtp = async () => {
    if (!email) {
      setErrMessage("Vui lòng nhập email của bạn!");
      return;
    }
    setErrMessage("");
    try {
      setIsLoading(true);
      const res = await axiosInstance.post("/api/v1/auth/forgot-password", {
        email: email,
      });
      if (res.status === 200) {
        setStepForgot("otp");
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      setErrMessage(error?.response?.data.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmOtp = async () => {
    if (!otp) {
      setErrMessage("Vui lòng nhập mã OTP đã gửi đến email!");
      return;
    }
    if (otp.length < 6 || otp.length > 6) {
      setErrMessage("Mã OTP phải đủ 6 số!");
      return;
    }
    setErrMessage("");
    try {
      setIsLoading(true);
      const res = await axiosInstance.post("/api/v1/auth/verify-otp", {
        email: email,
        otp,
      });
      if (res.status === 200) {
        setStepForgot("reset");
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      setErrMessage(error?.response?.data.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword) {
      setErrMessageReset((prev) => ({
        ...prev,
        newPassword: "Vui lòng nhập mật khẩu mới!",
      }));
      return;
    }
    if (!confirmPassword) {
      setErrMessageReset((prev) => ({
        ...prev,
        confirmPassword: "Vui lòng xác nhận mật khẩu!",
      }));
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrMessage("Mật khẩu xác nhận không đúng!");
      return;
    }
    setErrMessage("");
    try {
      setIsLoading(true);
      const res = await axiosInstance.post("/api/v1/auth/reset-password", {
        email: email,
        otp,
        newPassword,
      });
      if (res.status === 200) {
        setStepForgot("complete");
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      setErrMessage(error?.response?.data.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 p-[2rem]">
      <div className="flex items-center gap-2 mb-8">
        <button
          className="w-12 h-12 rounded-md bg-gray-100 hover:bg-gray-200 cursor-pointer"
          onClick={() => {
            const prev = prevStep[stepForgot];
            if (prev === "form") setStep("form");
            else setStepForgot(prev);
          }}
        >
          <FontAwesomeIcon icon={faAngleLeft} className="text-gray-600" />
        </button>
        <h3 className="text-[2.2rem] font-medium">Quên mật khẩu</h3>
      </div>
      {stepForgot === "email" ? (
        <>
          <p className="text-blue-500 text-[1.4rem] w-full py-2 px-5 rounded-xl mb-5 bg-blue-50">
            Nhập email để nhận mã otp
          </p>
          <label className="text-gray-500">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full h-[4.2rem] outline-none mt-2 pl-6 border border-gray-300 rounded-xl"
            placeholder="Nhập email của bạn..."
            onFocus={() => setErrMessage("")}
          />
          <p className="text-[1.4rem] text-red-500 mt-10">{errMessage}</p>
          <button
            type="button"
            disabled={isLoading}
            onClick={handleSendOtp}
            className="w-full mt-2 h-[4.2rem] flex items-center justify-center bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors duration-300 cursor-pointer"
          >
            {isLoading ? "Đang xử lý..." : "Gửi mã xác nhận"}
          </button>
          <p className="text-[1.4rem] text-center mt-5 flex items-center justify-center gap-2">
            Bạn nhớ mật khẩu?{" "}
            <span
              className="text-blue-600 cursor-pointer"
              onClick={() => setStep("form")}
            >
              Đăng nhập
            </span>
          </p>
        </>
      ) : stepForgot === "otp" ? (
        <div>
          <p className="text-gray-500 text-[1.4rem] w-full py-2 px-5 rounded-xl mb-5 bg-blue-100">
            Mã OTP đã được gửi đến email {email}
          </p>
          <label>Mã OTP</label>
          <input
            type="number"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            className="w-full h-[4.2rem] outline-none mt-2 pl-6 border border-gray-300 rounded-xl text-center"
            placeholder="_ _ _ _ _ _"
            onFocus={() => {
              setErrMessage("");
            }}
          />
          <p className="text-[1.4rem] text-red-500 mt-10">{errMessage}</p>
          <button
            type="button"
            disabled={isLoading}
            onClick={handleConfirmOtp}
            className="w-full mt-2 h-[4.2rem] flex items-center justify-center bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors duration-300 cursor-pointer"
          >
            {isLoading ? "Đang xử lý..." : "Xác nhận OTP"}
          </button>
        </div>
      ) : stepForgot === "reset" ? (
        <div>
          <p className="mb-5">Đặt lại mật khẩu</p>
          <div className="space-y-5">
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
                  onFocus={() => setErrMessage("")}
                />
                <button
                  className="absolute top-[50%] right-6 -translate-y-[50%] cursor-pointer"
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
              <p className="text-[1.4rem] text-red-500 mt-1">
                {errMessageReset.newPassword}
              </p>
            </div>
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
                  onFocus={() => setErrMessage("")}
                />
                <button
                  className="absolute top-[50%] right-6 -translate-y-[50%] cursor-pointer"
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
              <p className="text-[1.4rem] text-red-500 mt-1">
                {errMessageReset.confirmPassword}
              </p>
            </div>
          </div>
          <p className="text-[1.4rem] text-red-500 mt-10">{errMessage}</p>
          <button
            type="button"
            disabled={isLoading}
            onClick={handleResetPassword}
            className="w-full mt-2 h-[4.2rem] flex items-center justify-center bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors duration-300 cursor-pointer"
          >
            {isLoading ? "Đang xử lý..." : "Đặt lại mật khẩu"}
          </button>
        </div>
      ) : (
        <div className="text-center">
          <div className="w-[4rem] h-[4rem] mx-auto rounded-full bg-green-600 flex items-center justify-center">
            <FontAwesomeIcon
              icon={faCheck}
              className="text-white text-[2.2rem]"
            />
          </div>
          <p className="mt-5 text-gray-600">Đặt lại mật khẩu thành công!</p>
          <p className="mt-2 text-[1.2rem] text-gray-600">
            Mật khẩu của bạn đã được cập nhật. Vui lòng đăng nhập lại.
          </p>
          <button
            type="button"
            className="w-full mt-5 h-[4.2rem] flex items-center justify-center bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors duration-300 cursor-pointer"
            onClick={() => setStep("form")}
          >
            Về đăng nhập
          </button>
        </div>
      )}
    </div>
  );
}

export default ForgotPass;
