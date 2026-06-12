import { type SetStateAction } from "react";
import type React from "react";
import OtpInputFields from "../../OtpInputFields";

interface VerifyOtpStepProps {
  type: "" | "email" | "phone";
  value: string;
  otp: string[];
  setOtp: React.Dispatch<SetStateAction<string[]>>;
  countdown: number;
  canResend: boolean;
  onResend: () => void;
  onConfirm: () => void;
  loading: boolean;
}

function VerifyOtpStep({
  type,
  value,
  otp,
  setOtp,
  countdown,
  canResend,
  onResend,
  onConfirm,
  loading,
}: VerifyOtpStepProps) {
  const isEmail = type === "email";

  return (
    <div className="p-8">
      <div className="text-center">
        <h3 className="text-[2.4rem] font-semibold text-gray-900">
          Xác thực OTP
        </h3>

        <p className="text-gray-500 mt-3 leading-relaxed">
          Nhập mã OTP đã được gửi đến{" "}
          <span className="font-medium text-gray-700">
            {isEmail ? "email" : "số điện thoại"}
          </span>
        </p>

        <p className="text-amber-600 font-medium mt-1">{value}</p>
      </div>

      <div className="flex justify-center mt-10">
        <OtpInputFields otp={otp} setOtp={setOtp} style="small" />
      </div>

      <div className="text-center mt-6">
        <p className="text-gray-500">Mã OTP sẽ hết hạn sau 5 phút</p>
      </div>

      <button
        type="button"
        onClick={onConfirm}
        disabled={loading}
        className="w-full h-[4.8rem] rounded-xl bg-amber-500 hover:bg-amber-600 transition-colors duration-300 text-white font-medium mt-10 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Đang xác thực..." : "Xác nhận"}
      </button>

      <div className="flex items-center justify-center gap-2 mt-6 text-[1.5rem]">
        <span className="text-gray-500">Không nhận được mã?</span>

        {canResend ? (
          <button
            type="button"
            onClick={onResend}
            disabled={loading}
            className="text-blue-500 hover:text-blue-700 font-medium hover:cursor-pointer"
          >
            Gửi lại
          </button>
        ) : (
          <span className="text-gray-400">({countdown}s)</span>
        )}
      </div>
    </div>
  );
}

export default VerifyOtpStep;
