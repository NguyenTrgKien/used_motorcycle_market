import { useState, type Dispatch, type SetStateAction } from "react";
import { useUser } from "../../../hooks/useUser";

interface PhoneInputStepProp {
  value: string;
  onChange: Dispatch<SetStateAction<string>>;
  onSubmit: () => void;
  loading: boolean;
}

function PhoneInputStep({
  value,
  onChange,
  onSubmit,
  loading,
}: PhoneInputStepProp) {
  const { user } = useUser();
  const [errMessage, setErrMessage] = useState("");

  const handleSubmit = () => {
    if (!value) {
      setErrMessage("Vui lòng nhập số điện thoại!");
      return;
    }
    onSubmit();
  };

  return (
    <div className="w-full h-auto p-6">
      <label htmlFor="password" className="text-gray-600">
        {user.phone ? "Nhập số điện thoại mới" : "Nhập số điện thoại"}
      </label>
      <div className="relative w-full h-[4.6rem] mt-2">
        <input
          type={"text"}
          value={value}
          className="w-full h-full rounded-lg px-8 border border-gray-300 outline-none "
          placeholder="VD: 0521545654"
          onFocus={() => setErrMessage("")}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
      <p className="text-[1.4rem] mt-2 text-red-500">{errMessage}</p>
      <button
        className="w-full h-[4.6rem] rounded-lg border border-gray-300 mt-8 outline-none px-8 text-white bg-amber-500 hover:bg-amber-600 transition-colors duration-300 hover:cursor-pointer"
        onClick={() => handleSubmit()}
        disabled={loading}
      >
        {loading ? "Đang xử lý" : "Xác nhận"}
      </button>
    </div>
  );
}

export default PhoneInputStep;
