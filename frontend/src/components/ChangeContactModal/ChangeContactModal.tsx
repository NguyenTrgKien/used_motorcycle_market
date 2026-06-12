import { faClose } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { motion, AnimatePresence } from "framer-motion";
import { useMemo, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import axiosInstance from "../../configs/axiosInstance";
import { useUser } from "../../hooks/useUser";
import useOtpCountdown from "../../hooks/useOtpCountdown";

import EmailInputStep from "./steps/EmailInputStep";
import PhoneInputStep from "./steps/PhoneInputStep";
import VerifyOtpStep from "./steps/VerifyOtpStep";
import VerifyPasswordStep from "./steps/VerifyPasswordStep";
import SuccessStep from "./steps/SuccessStep";

type ChangeContactType = "" | "email" | "phone";

type Step = "verifyPassword" | "contactInput" | "verifyOtp" | "success";

interface ChangeContactModalProps {
  type: ChangeContactType;
  onClose: () => void;
}

function ChangeContactModal({ type, onClose }: ChangeContactModalProps) {
  const { user } = useUser();
  const queryClient = useQueryClient();

  const isLinkingPhone = type === "phone" && !user?.phone;

  const [step, setStep] = useState<Step>(
    isLinkingPhone ? "contactInput" : "verifyPassword",
  );

  const [contactValue, setContactValue] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));

  const inputRefs = useRef<Array<HTMLInputElement | null>>(Array(6).fill(null));

  const emailCountdown = useOtpCountdown({
    duration: 60,
    storageKey: "change-contact-email",
  });

  const phoneCountdown = useOtpCountdown({
    duration: 60,
    storageKey: "change-contact-phone",
  });

  const { countdown, canResend, startCountdown } =
    type === "email" ? emailCountdown : phoneCountdown;

  const currentTitle = useMemo(() => {
    if (type === "email") return "Thay đổi email";
    if (isLinkingPhone) return "Liên kết số điện thoại";
    return "Thay đổi số điện thoại";
  }, [type, isLinkingPhone]);

  const verifyPasswordMutation = useMutation({
    mutationFn: async () => {
      return await axiosInstance.post("/api/v1/auth/verify-password", {
        password,
      });
    },

    onSuccess: () => {
      setStep("contactInput");
    },

    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Mật khẩu không chính xác");
    },
  });

  const requestContactOtpMutation = useMutation({
    mutationFn: async () => {
      return await axiosInstance.post("/api/v1/auth/contact/change", {
        contact: contactValue.trim(),
      });
    },

    onSuccess: (res: any) => {
      toast.success(res.data.message);
      startCountdown();
      setOtp(Array(6).fill(""));
      setStep("verifyOtp");
    },

    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Không thể gửi OTP");
    },
  });

  const verifyContactOtpMutation = useMutation({
    mutationFn: async () => {
      return await axiosInstance.post(
        "/api/v1/auth/verify-change-contact-otp",
        {
          otp: otp.join("").trim(),
        },
      );
    },

    onSuccess: (res: any) => {
      toast.success(res.data.message);
      queryClient.invalidateQueries({ queryKey: ["user"] });
      setStep("success");
    },

    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "OTP không hợp lệ");
    },
  });

  const resendOtpMutation = useMutation({
    mutationFn: async () =>
      axiosInstance.post("/api/v1/auth/resend-change-contact-otp"),
  });

  const handleVerifyPassword = () => {
    if (!password.trim()) return;
    verifyPasswordMutation.mutate();
  };

  const handleSubmitContact = () => {
    if (!contactValue.trim()) {
      toast.error(
        type === "email"
          ? "Vui lòng nhập email"
          : "Vui lòng nhập số điện thoại",
      );
      return;
    }

    if (type === "email" && contactValue === user?.email) {
      toast.error("Email mới không được trùng email hiện tại");
      return;
    }

    if (type === "phone" && !isLinkingPhone && contactValue === user?.phone) {
      toast.error("Số điện thoại mới không được trùng");
      return;
    }

    requestContactOtpMutation.mutate();
  };

  const handleVerifyOtp = () => {
    const otpCode = otp.join("");

    if (otpCode.length !== 6) {
      toast.error("Vui lòng nhập đầy đủ OTP");
      return;
    }

    verifyContactOtpMutation.mutate();
  };

  const handleResendOtp = async () => {
    if (!canResend) return;

    try {
      resendOtpMutation.mutate();

      setOtp(Array(6).fill(""));
      inputRefs.current[0]?.focus();
      startCountdown();

      toast.success("Đã gửi lại OTP");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Không thể gửi lại OTP");
    }
  };

  const contactInputLoading = requestContactOtpMutation.isPending;
  const verifyOtpLoading = verifyContactOtpMutation.isPending;
  const isBusy =
    verifyPasswordMutation.isPending ||
    requestContactOtpMutation.isPending ||
    verifyContactOtpMutation.isPending;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 30 }}
        transition={{ duration: 0.2 }}
        className="w-[92%] md:w-[50rem] bg-white rounded-2xl shadow-xl overflow-hidden"
      >
        <div className="flex items-center border-b border-gray-200 px-6 py-5">
          <div>
            <h2 className="text-[2rem] font-medium">{currentTitle}</h2>

            <p className="text-gray-500 text-[1.4rem]">
              Cập nhật thông tin tài khoản của bạn
            </p>
          </div>

          <button
            onClick={onClose}
            disabled={isBusy}
            className="ml-auto w-11 h-11 rounded-xl bg-gray-100 hover:bg-gray-200 transition-all"
          >
            <FontAwesomeIcon icon={faClose} />
          </button>
        </div>

        <div className="h-auto">
          <AnimatePresence mode="wait">
            {step === "verifyPassword" && (
              <motion.div
                key="verifyPassword"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <VerifyPasswordStep
                  password={password}
                  onChange={setPassword}
                  onSubmit={handleVerifyPassword}
                  loading={verifyPasswordMutation.isPending}
                />
              </motion.div>
            )}

            {step === "contactInput" && (
              <motion.div
                key="contactInput"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                {type === "email" ? (
                  <EmailInputStep
                    value={contactValue}
                    onChange={setContactValue}
                    onSubmit={handleSubmitContact}
                    loading={contactInputLoading}
                  />
                ) : (
                  <PhoneInputStep
                    value={contactValue}
                    onChange={setContactValue}
                    onSubmit={handleSubmitContact}
                    loading={contactInputLoading}
                  />
                )}
              </motion.div>
            )}

            {step === "verifyOtp" && (
              <motion.div
                key="verifyOtp"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <VerifyOtpStep
                  type={type}
                  value={contactValue}
                  otp={otp}
                  setOtp={setOtp}
                  countdown={countdown}
                  canResend={canResend}
                  onResend={handleResendOtp}
                  onConfirm={handleVerifyOtp}
                  loading={verifyOtpLoading || resendOtpMutation.isPending}
                />
              </motion.div>
            )}

            {step === "success" && (
              <motion.div
                key="success"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <SuccessStep
                  type={type}
                  value={contactValue}
                  onClose={onClose}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

export default ChangeContactModal;
