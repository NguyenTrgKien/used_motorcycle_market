import { useEffect, useRef, type SetStateAction } from "react";
import { toast } from "react-toastify";

interface OtpInputFieldProps {
  otp: string[];
  setOtp: React.Dispatch<SetStateAction<string[]>>;
  style: "small" | "large";
}

function OtpInputFields({ otp, setOtp, style }: OtpInputFieldProps) {
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }

    if (e.key === "ArrowRight" && index < 5) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }

    if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasteData = e.clipboardData.getData("text").trim();
    if (pasteData.length !== 6 || !/^\d+$/.test(pasteData)) {
      toast.error("Dữ liệu dán không hợp lệ, vui lòng dán mã 6 chữ số!");
      return;
    }
    setOtp(pasteData.split(""));
  };

  return (
    <div className="flex items-center gap-5">
      {otp.map((otpNum, index) => {
        return (
          <div key={index} className="flex items-center gap-5">
            {index === 3 && (
              <span className="inline-block w-8 border-t border-t-gray-400"></span>
            )}
            <input
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              type="text"
              autoComplete="one-time-code"
              inputMode="numeric"
              maxLength={1}
              value={otpNum}
              className={`${style === "small" ? "w-15 h-20" : "w-20 h-25"}  rounded-lg border focus:outline-1 focus:outline-blue-500 border-gray-400 text-center text-[2rem]`}
              onPaste={(e) => handlePaste(e)}
              onChange={(e) => {
                handleChange(index, e.target.value);
              }}
              onKeyDown={(e) => handleKeyDown(index, e)}
            />
          </div>
        );
      })}
    </div>
  );
}

export default OtpInputFields;
