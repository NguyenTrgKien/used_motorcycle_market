import { faShield } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useUser } from "../../hooks/useUser";
import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import axiosInstance from "../../configs/axiosInstance";
import { useNavigate } from "react-router-dom";
import OtpInputFields from "../../components/OtpInputFields";
import useOtpCountdown from "../../hooks/useOtpCountdown";

type OtpMode = "verify" | "forgot_password";

function VerifyOtp() {
  const { user } = useUser();
  const navigate = useNavigate();
  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const [mode, setMode] = useState<OtpMode>("verify");
  const [forgotEmail, setForgotEmail] = useState<string>("");
  const { countdown, canResend, startCountdown } = useOtpCountdown({
    duration: 60,
    storageKey: "otpCountdown",
  });
  const [canSubmit, setCanSubmit] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const isNavigating = useRef(false);

  useEffect(() => {
    if (isNavigating.current) return;

    const otpMode = sessionStorage.getItem("otpMode") as OtpMode | null;

    if (otpMode === "forgot_password") {
      const email = sessionStorage.getItem("forgotPassword");
      if (!email) {
        navigate("/");
        return;
      }
      setMode("forgot_password");
      setForgotEmail(email);
      return;
    }

    const pending = sessionStorage.getItem("pendingVerify");
    if (!pending) {
      navigate("/");
      return;
    }
    if (user?.isVerified) {
      sessionStorage.removeItem("pendingVerify");
      navigate("/");
    }
  }, [navigate, user]);

  useEffect(() => {
    const existing = localStorage.getItem("otpCountdown");
    if (!existing) {
      startCountdown();
    }
  }, [startCountdown]);

  useEffect(() => {
    const isFilled = otp.every((digit) => digit !== "");
    setCanSubmit(isFilled);
  }, [otp]);

  const handleResend = async () => {
    if (!canResend) return;
    try {
      setIsResending(true);
      if (mode === "forgot_password") {
        await axiosInstance.post("/api/v1/auth/forgot-password", {
          email: forgotEmail,
        });
      } else {
        await axiosInstance.post("/api/v1/auth/resend-verification-otp");
      }
      setOtp(Array(6).fill(""));
      startCountdown();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          "Gửi mã thất bại, vui lòng thử lại sau",
      );
    } finally {
      setIsResending(false);
    }
  };

  const handleConfirm = async () => {
    if (otp.some((num) => num === "")) {
      toast.error("Vui lòng nhập đầy đủ mã OTP!");
      return;
    }
    const otpCode = otp.join("");

    try {
      setIsConfirming(true);

      if (mode === "forgot_password") {
        await axiosInstance.post("/api/v1/auth/verify-forgot-password-otp", {
          email: forgotEmail,
          otp: otpCode,
        });
        toast.success("Xác thực thành công!");
        isNavigating.current = true;
        sessionStorage.setItem("resetEmail", forgotEmail);
        sessionStorage.removeItem("otpMode");
        sessionStorage.removeItem("forgotPassword");
        navigate("/reset-password");
      } else {
        await axiosInstance.post("/api/v1/auth/verify-email", {
          email: user?.email,
          otp: otpCode,
        });
        toast.success("Xác thực thành công!");
        sessionStorage.removeItem("pendingVerify");
        navigate("/");
      }
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          "Xác thực thất bại, vui lòng thử lại!",
      );
    } finally {
      setIsConfirming(false);
    }
  };

  const displayEmail = mode === "forgot_password" ? forgotEmail : user?.email;

  return (
    <div className="w-full h-[100vh] flex items-start justify-center bg-gray-100">
      <div className="w-auto h-auto p-10 text-center flex flex-col items-center gap-8 mt-20 bg-white border border-gray-300 rounded-xl">
        <span className="w-20 h-20 rounded-full border-2 border-blue-500 flex items-center justify-center">
          <FontAwesomeIcon
            icon={faShield}
            className="text-blue-500 text-[2rem]"
          />
        </span>
        <div>
          <h5 className="text-[2.2rem]">
            {mode === "forgot_password"
              ? "Xác thực quên mật khẩu"
              : "Xác thực tài khoản"}
          </h5>
          <p className="text-gray-600">Nhập mã 6 chữ số đã gửi đến email</p>
          <p className="text-gray-600">{displayEmail}</p>
        </div>
        <div className="flex flex-col gap-5 items-center justify-center">
          <OtpInputFields otp={otp} setOtp={setOtp} style={"large"} />
        </div>
        <p className="text-gray-600">Mã hết hạn sau: 5 phút</p>
        <button
          type="button"
          className={`w-full h-[4.2rem] ${
            canSubmit ? "bg-blue-500 hover:bg-blue-600" : "bg-gray-400"
          } text-white rounded-lg transition-colors hover:cursor-pointer`}
          onClick={() => handleConfirm()}
          disabled={!canSubmit || isConfirming || isResending}
        >
          {isConfirming ? "Đang xác nhận..." : "Xác nhận"}
        </button>
        <div className="flex items-center gap-2">
          Không nhận được mã?{" "}
          {canResend ? (
            <button
              type="button"
              className="text-blue-500 hover:text-blue-700 hover:cursor-pointer"
              onClick={() => handleResend()}
              disabled={isResending}
            >
              {isResending ? "Đang gửi..." : "Gửi lại"}
            </button>
          ) : (
            <div className="text-gray-500">({countdown})</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default VerifyOtp;