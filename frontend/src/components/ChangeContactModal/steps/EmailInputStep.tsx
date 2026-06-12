import { faEnvelope } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState, type Dispatch, type SetStateAction } from "react";

interface EmailInputStepProps {
  value: string;
  onChange: Dispatch<SetStateAction<string>>;
  onSubmit: () => void;
  loading: boolean;
}

function EmailInputStep({
  value,
  onChange,
  onSubmit,
  loading,
}: EmailInputStepProps) {
  const [errMessage, setErrMessage] = useState("");

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = () => {
    if (!value.trim()) {
      setErrMessage("Vui lòng nhập email!");
      return;
    }

    if (!validateEmail(value)) {
      setErrMessage("Email không hợp lệ!");
      return;
    }

    onSubmit();
  };

  return (
    <div className="w-full h-auto p-6">
      <label htmlFor="email" className="text-gray-600">
        Nhập email mới
      </label>

      <div className="relative w-full h-[4.6rem] mt-2">
        <span className="absolute top-[50%] left-4 translate-y-[-50%] text-gray-400 pointer-events-none">
          <FontAwesomeIcon icon={faEnvelope} />
        </span>
        <input
          id="email"
          type="email"
          value={value}
          className="w-full h-full rounded-lg pl-15 pr-8 border border-gray-300 outline-none focus:border-amber-400 transition-colors"
          placeholder="VD: example@email.com"
          onFocus={() => setErrMessage("")}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        />
      </div>

      <p className="text-[1.4rem] mt-2 text-red-500 min-h-[2rem]">
        {errMessage}
      </p>

      <button
        className="w-full h-[4.6rem] rounded-lg border border-gray-300 mt-6 outline-none px-8 text-white bg-amber-500 hover:bg-amber-600 transition-colors duration-300 hover:cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={handleSubmit}
        disabled={loading}
      >
        {loading ? "Đang xử lý..." : "Gửi mã OTP"}
      </button>
    </div>
  );
}

export default EmailInputStep;
