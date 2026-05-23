import { faClose } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { motion } from "framer-motion";
import { useUser } from "../hooks/useUser";
import OtpInputFields from "./OtpInputFields";
import { useRef, useState } from "react";
import { toast } from "react-toastify";
import useOtpCountdown from "../hooks/useOtpCountdown";
import axiosInstance from "../configs/axiosInstance";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface ChangeEmailModalProps {
  onClose: () => void;
}

function ChangeEmailModal({ onClose }: ChangeEmailModalProps) {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const inputRefs = useRef<Array<HTMLInputElement | null>>(Array(6).fill(null));
  const { countdown, canResend, startCountdown } = useOtpCountdown({
    duration: 60,
    storageKey: "otpCountdown",
  });
  const [isVerifiedEmail, setIsVerifiedOtpEmail] = useState(false);
  const [errMessage, setErrMessage] = useState("");
  const [isResending, setIsResending] = useState(false);

  // new email
  const [newEmail, setNewEmail] = useState("");

  const confirmOtpMutation = useMutation({
    mutationFn: async (otpCode: string) => {
      const res = await axiosInstance.post(
        "/api/v1/auth/verify-change-email-otp",
        {
          otp: otpCode,
        },
      );
      return res;
    },
    onSuccess: (res: any) => {
      toast.success(res.data.message);
      sessionStorage.removeItem("otpCountdown");
      onClose();
      queryClient.invalidateQueries({ queryKey: ["user"] });
    },
    onError: async (error: any) => {
      toast.error(
        error?.response?.data?.message ||
          "Xác thực thất bại, vui lòng thử lại!",
      );
    },
  });

  const verifyEmailMutation = useMutation({
    mutationFn: async () =>
      await axiosInstance.post("/api/v1/auth/email/change", {
        newEmail: newEmail,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user"] });
      setIsVerifiedOtpEmail(true);
    },
    onError: (error: any) => {
      toast.error(error.response?.data.message);
    },
  });

  const handleResend = async () => {
    if (!canResend) return;
    try {
      setIsResending(true);
      await axiosInstance.post("/api/v1/auth/resend-change-email-otp");
      setOtp(Array(6).fill(""));
      inputRefs.current[0]?.focus();
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
    confirmOtpMutation.mutate(otpCode);
  };

  const handleVerifyEmail = () => {
    console.log("hihi");
    if (!newEmail) {
      setErrMessage("Vui lòng nhập email mới!");
      return;
    }
    if (newEmail === user.email) {
      setErrMessage("Email mới không được trùng với email hiện tại!");
      return;
    }

    verifyEmailMutation.mutate();
  };

  const isValidateEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail);

  return (
    <div className="fixed inset-0 w-full h-full flex items-center justify-center bg-[#38383873] z-[100]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        exit={{ opacity: 0, y: 20 }}
        className="w-[90%] md:w-[50rem] lg:w-[50rem] h-auto bg-white shadow-xl rounded-2xl"
      >
        <div className="w-full flex relative border-b border-b-gray-200 pb-5 rounded-tl-2xl rounded-tr-2xl p-5">
          <h4 className="text-[1.8rem] w-full">Thay đổi email</h4>
          <button
            className="ml-auto w-12 h-12  rounded-sm flex items-center justify-center bg-gray-100 hover:bg-gray-200 transition-colors duration-300 text-gray-500 hover:cursor-pointer"
            onClick={onClose}
          >
            <FontAwesomeIcon icon={faClose} />
          </button>
        </div>

        {!isVerifiedEmail ? (
          <div className="space-y-2 p-8">
            <p className="px-5 py-2 bg-cyan-100 rounded-lg text-gray-600 mb-5">
              Nhập email mới của bạn để nhận OTP.
            </p>
            <label htmlFor="newEmail" className="text-gray-600 block mb-1">
              Nhập email mới của bạn
            </label>
            <input
              type="email"
              className="w-full h-[4.6rem] rounded-lg border border-gray-300 px-5 outline-none"
              name="newEmail"
              placeholder="Email..."
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              onFocus={() => setErrMessage("")}
            />
            <p className="text-red-500 mt-10">{errMessage}</p>
            <button
              type="button"
              className="w-full h-[4.6rem] bg-amber-500 text-white hover:bg-amber-600 transition-colors rounded-lg mt-5 hover:cursor-pointer"
              disabled={!isValidateEmail || verifyEmailMutation.isPending}
              onClick={handleVerifyEmail}
            >
              {verifyEmailMutation.isPending ? "Đang xử lý..." : "Xác nhận"}
            </button>
          </div>
        ) : (
          <div className="space-y-2 p-8">
            <h4 className="text-[2rem] text-gray-900 font-medium">
              Xác thực tài khoản
            </h4>
            <p className="text-gray-600">
              Nhập mã OTP được gửi đến email {newEmail}
            </p>
            <div className="flex flex-col gap-5 items-center justify-center mt-10">
              <OtpInputFields otp={otp} setOtp={setOtp} style={"small"} />
              <p className="text-gray-600">Mã hết hạn sau: 5 phút</p>
            </div>

            <button
              type="button"
              className="w-full h-[4.6rem] bg-amber-500 text-white hover:bg-amber-600 transition-colors rounded-lg mt-5 hover:cursor-pointer"
              disabled={confirmOtpMutation.isPending || isResending}
              onClick={handleConfirm}
            >
              Xác nhận
            </button>
            <div className="flex items-center justify-center gap-2 mt-5">
              Không nhận được mã?{" "}
              {canResend ? (
                <button
                  type="button"
                  className="text-blue-500 hover:text-blue-700 hover:cursor-pointer"
                  onClick={() => handleResend()}
                  disabled={isResending || confirmOtpMutation.isPending}
                >
                  {isResending ? "Đang gửi..." : "Gửi lại"}
                </button>
              ) : (
                <div className="text-gray-500">({countdown})</div>
              )}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default ChangeEmailModal;
