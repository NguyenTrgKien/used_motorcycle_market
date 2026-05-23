import { faEye, faEyeSlash } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState, type Dispatch, type SetStateAction } from "react";

interface VerifyPasswordStepProp {
  password: string;
  onChange: Dispatch<SetStateAction<string>>;
  onSubmit: () => void;
  loading: boolean;
}

function VerifyPasswordStep({
  password,
  onChange,
  onSubmit,
  loading,
}: VerifyPasswordStepProp) {
  const [showPassword, setShowPassword] = useState(false);
  const [errMessage, setErrMessage] = useState("");

  const handleSubmit = () => {
    if (!password) {
      setErrMessage("Vui lòng nhập mật khẩu!");
      return;
    }
    onSubmit();
  };

  return (
    <div className="w-full h-auto p-6">
      <label htmlFor="password" className="text-gray-600">
        Nhập mật khẩu của bạn
      </label>
      <div className="relative w-full h-[4.6rem] mt-2">
        <input
          type={showPassword ? "text" : "password"}
          value={password}
          className="w-full h-full rounded-lg px-8 border border-gray-300 outline-none "
          placeholder="********"
          onFocus={() => setErrMessage("")}
          onChange={(e) => onChange(e.target.value)}
        />
        <button
          className="absolute top-[50%] right-5 translate-y-[-50%] hover:cursor-pointer"
          onClick={() => setShowPassword(!showPassword)}
        >
          <FontAwesomeIcon icon={showPassword ? faEye : faEyeSlash} />
        </button>
      </div>
      <p className="text-[1.4rem] mt-2 text-red-500">{errMessage}</p>
      <button
        className="w-full h-[4.6rem] rounded-lg border border-gray-300 mt-8 outline-none px-8 text-white bg-amber-500 hover:bg-amber-600 transition-colors duration-300 hover:cursor-pointer"
        onClick={handleSubmit}
        disabled={loading}
      >
        {loading ? "Đang xử lý" : "Xác nhận mật khẩu"}
      </button>
    </div>
  );
}

export default VerifyPasswordStep;
