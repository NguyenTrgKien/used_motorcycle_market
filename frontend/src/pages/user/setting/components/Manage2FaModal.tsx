import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import axiosInstance from "../../../../configs/axiosInstance";
import { toast } from "react-toastify";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faClose,
  faShieldHalved,
  faArrowLeft,
} from "@fortawesome/free-solid-svg-icons";
import type { TwoFactorMethod } from "../types/setting.type";
import { useUser } from "../../../../hooks/useUser";

interface Manage2FAModalProps {
  twoFactorEnabled: boolean;
  onClose: () => void;
}

export default function Manage2FAModal({
  twoFactorEnabled,
  onClose,
}: Manage2FAModalProps) {
  const { user } = useUser();
  const [selected, setSelected] = useState<TwoFactorMethod>("email");
  const [step, setStep] = useState<"select" | "otp">("select");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [expiredAt, setExpiredAt] = useState<number | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [cooldown, setCooldown] = useState(0);
  const queryClient = useQueryClient();

  const action = twoFactorEnabled ? "disable" : "enable";

  useEffect(() => {
    const storedCooldown = localStorage.getItem("2fa_resend_cooldown");
    const storedOtpState = localStorage.getItem("2fa_otp_state");

    if (storedCooldown) {
      const remaining = Math.max(
        0,
        Math.ceil((Number(storedCooldown) - Date.now()) / 1000),
      );

      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCooldown(remaining);
    }

    if (storedOtpState) {
      const otpState = JSON.parse(storedOtpState);

      const isOtpStillValid =
        new Date(otpState.expiredAt).getTime() > Date.now();

      if (
        isOtpStillValid &&
        otpState.action === action &&
        otpState.method === selected
      ) {
        setSelected(otpState.method);
        setStep("otp");

        const minutes = Math.ceil(
          (new Date(otpState.expiredAt).getTime() - Date.now()) / (1000 * 60),
        );

        setExpiredAt(minutes);
      } else {
        localStorage.removeItem("2fa_otp_state");
      }
    }
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;

    const timer = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          localStorage.removeItem("2fa_resend_cooldown");
          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldown]);

  const sendOtpMutation = useMutation({
    mutationFn: () =>
      axiosInstance.patch("/api/v1/auth/2fa/send-otp", {
        action,
        method: selected,
      }),
    onSuccess: (res: any) => {
      const minutes = Math.ceil(
        (new Date(res.data?.data?.expiredAt).getTime() - Date.now()) /
          (1000 * 60),
      );
      setExpiredAt(minutes);
      const resendAt = Date.now() + 60 * 1000;
      localStorage.setItem("2fa_resend_cooldown", resendAt.toString());
      localStorage.setItem(
        "2fa_otp_state",
        JSON.stringify({
          method: selected,
          expiredAt: res.data?.data?.expiredAt,
          action,
        }),
      );
      setCooldown(60);
      setStep("otp");
      toast.success(res.data?.message);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Không thể gửi OTP");
    },
  });

  const verifyOtpMutation = useMutation({
    mutationFn: () =>
      axiosInstance.patch("/api/v1/auth/2fa/verify-otp", {
        otp: otp.join(""),
        action,
        method: selected,
      }),
    onSuccess: (res: any) => {
      toast.success(res.data?.message);
      onClose();
      queryClient.invalidateQueries({ queryKey: ["user-security"] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Mã OTP không hợp lệ");
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    },
  });

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const next = [...otp];
    next[index] = value;
    setOtp(next);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    if (!pasted) return;
    e.preventDefault();
    const next = [...otp];
    pasted.split("").forEach((c, i) => {
      next[i] = c;
    });
    setOtp(next);
    inputRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const handleRequestOtp = () => {
    const storedOtpState = localStorage.getItem("2fa_otp_state");

    if (storedOtpState) {
      const otpState = JSON.parse(storedOtpState);

      const isOtpStillValid =
        new Date(otpState.expiredAt).getTime() > Date.now();

      if (isOtpStillValid) {
        setSelected(otpState.method);

        const minutes = Math.ceil(
          (new Date(otpState.expiredAt).getTime() - Date.now()) / (1000 * 60),
        );

        setExpiredAt(minutes);
        setStep("otp");

        return;
      }

      localStorage.removeItem("2fa_otp_state");
    }

    sendOtpMutation.mutate();
  };

  const otpFilled = otp.every((d) => d !== "");

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
          {step === "otp" && (
            <button
              onClick={() => {
                setStep("select");
                setOtp(["", "", "", "", "", ""]);
              }}
              className="mr-3 w-11 h-11 rounded-xl bg-gray-100 hover:bg-gray-200 transition-all"
            >
              <FontAwesomeIcon icon={faArrowLeft} />
            </button>
          )}
          <div>
            <h2 className="text-[2rem] font-medium">
              {step === "select" ? "Quản lý xác thực 2 yếu tố" : "Nhập mã OTP"}
            </h2>
            <p className="text-gray-500 text-[1.4rem]">
              {step === "select"
                ? "Thêm lớp bảo mật cho tài khoản"
                : `Mã đã được gửi qua ${selected === "email" ? "email" : "SMS"}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="ml-auto w-11 h-11 rounded-xl bg-gray-100 hover:bg-gray-200 transition-all"
          >
            <FontAwesomeIcon icon={faClose} />
          </button>
        </div>

        <div className="p-6">
          {step === "select" ? (
            <>
              <div
                className={`flex items-center gap-3 px-4 py-3 rounded-xl mb-6 ${twoFactorEnabled ? "bg-green-50 border border-green-200" : "bg-gray-50 border border-gray-200"}`}
              >
                <FontAwesomeIcon
                  icon={faShieldHalved}
                  className={`text-[1.6rem] ${twoFactorEnabled ? "text-green-500" : "text-gray-400"}`}
                />
                <div>
                  <p className="text-[1.4rem] font-medium text-gray-800">
                    2FA hiện đang{" "}
                    <span
                      className={
                        twoFactorEnabled ? "text-green-600" : "text-gray-500"
                      }
                    >
                      {twoFactorEnabled ? "bật" : "tắt"}
                    </span>
                  </p>
                  <p className="text-[1.3rem] text-gray-500">
                    {twoFactorEnabled
                      ? "Tài khoản được bảo vệ thêm bởi xác thực 2 yếu tố"
                      : "Bật 2FA để tăng cường bảo mật tài khoản"}
                  </p>
                </div>
              </div>

              <p className="text-[1.4rem] text-gray-600 mb-3">
                Phương thức nhận mã OTP
              </p>
              <div className="flex flex-col gap-3 mb-6">
                {(
                  [
                    {
                      key: "email" as const,
                      label: "Email",
                      desc: "Nhận OTP qua địa chỉ email đã liên kết",
                      icon: "✉️",
                    },
                    {
                      key: "sms" as const,
                      label: "SMS",
                      desc: "Nhận OTP qua số điện thoại đã liên kết",
                      icon: "📱",
                    },
                  ] as const
                ).map((m) => (
                  <button
                    key={m.key}
                    onClick={() => setSelected(m.key)}
                    className={`flex items-center gap-4 px-4 py-3 rounded-xl border text-left transition-colors ${selected === m.key ? "border-amber-400 bg-amber-50" : "border-gray-200 hover:bg-gray-50"}`}
                  >
                    <span className="text-[2rem]">{m.icon}</span>
                    <div className="flex-1">
                      <p className="text-[1.4rem] font-medium text-gray-800">
                        {m.label}
                      </p>
                      <p className="text-[1.3rem] text-gray-400">{m.desc}</p>
                    </div>
                    <span
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${selected === m.key ? "border-amber-500 bg-amber-500" : "border-gray-300"}`}
                    >
                      {selected === m.key && (
                        <span className="w-2 h-2 bg-white rounded-full" />
                      )}
                    </span>
                  </button>
                ))}
              </div>

              <button
                disabled={sendOtpMutation.isPending}
                className={`w-full h-[4.6rem] rounded-xl text-white text-[1.5rem] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${twoFactorEnabled ? "bg-red-500 hover:bg-red-600" : "bg-amber-500 hover:bg-amber-600"}`}
                onClick={() => handleRequestOtp()}
              >
                {sendOtpMutation.isPending ? "Đang gửi..." : "Gửi mã OTP"}
              </button>
            </>
          ) : (
            <>
              <div className="text-center">
                <p className="text-gray-500">
                  Vui lòng nhập mã OTP được gửi đến
                </p>
                <p className="text-orange-600">{user.email}</p>
              </div>
              <div
                className="flex justify-center gap-3 my-6"
                onPaste={handleOtpPaste}
              >
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => {
                      inputRefs.current[i] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    className="w-[4.8rem] h-[5.6rem] text-center text-[2rem] font-semibold border-2 rounded-xl outline-none transition-colors focus:border-amber-400 border-gray-200"
                  />
                ))}
              </div>

              <div className="text-center mt-6">
                <p className="text-gray-500">
                  Mã OTP sẽ hết hạn sau {expiredAt} phút
                </p>
              </div>

              <button
                onClick={() => verifyOtpMutation.mutate()}
                disabled={!otpFilled || verifyOtpMutation.isPending}
                className={`w-full h-[4.6rem] rounded-xl text-white text-[1.5rem] font-medium transition-colors mt-5 disabled:opacity-50 disabled:cursor-not-allowed ${twoFactorEnabled ? "bg-red-500 hover:bg-red-600" : "bg-amber-500 hover:bg-amber-600"}`}
              >
                {verifyOtpMutation.isPending
                  ? "Đang xác thực..."
                  : `Xác nhận ${twoFactorEnabled ? "tắt" : "bật"} 2FA`}
              </button>

              <button
                onClick={() => sendOtpMutation.mutate()}
                disabled={sendOtpMutation.isPending || cooldown > 0}
                className="w-full mt-5 text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50"
              >
                {cooldown > 0
                  ? `Gửi lại sau ${cooldown}s`
                  : sendOtpMutation.isPending
                    ? "Đang gửi lại..."
                    : "Gửi lại mã"}
              </button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
