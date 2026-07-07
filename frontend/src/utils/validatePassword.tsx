import { faCheck } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useState } from "react";

interface ValidatePasswordProps {
  password: string;
  setIsValid: (isValid: boolean) => void;
}

function ValidatePassword({ password, setIsValid }: ValidatePasswordProps) {
  const [errInfoPass, setErrInfoPass] = useState({
    limit: false,
    lowercase: false,
    uppercase: false,
    number: false,
    special: false,
  });

  useEffect(() => {
    let valid = true;
    if (password.length < 8 || password.length > 32) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setErrInfoPass((prev) => ({ ...prev, limit: true }));
      valid = false;
    } else {
      setErrInfoPass((prev) => ({ ...prev, limit: false }));
    }
    const isContainUppercase = /[A-Z]/.test(password);
    if (!isContainUppercase) {
      setErrInfoPass((prev) => ({ ...prev, uppercase: true }));
      valid = false;
    } else {
      setErrInfoPass((prev) => ({ ...prev, uppercase: false }));
    }
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    if (!hasSpecialChar) {
      setErrInfoPass((prev) => ({ ...prev, special: true }));
      valid = false;
    } else {
      setErrInfoPass((prev) => ({ ...prev, special: false }));
    }
    const isContainNumber = /[0-9]/.test(password);
    if (!isContainNumber) {
      setErrInfoPass((prev) => ({ ...prev, number: true }));
      valid = false;
    } else {
      setErrInfoPass((prev) => ({ ...prev, number: false }));
    }

    setIsValid(valid);
  }, [password, setIsValid]);

  return (
    <div className="flex items-center gap-15 mt-5 text-[1.2rem]">
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <span
            className={`w-6 h-6 rounded-full ${errInfoPass.limit ? "bg-gray-300" : " bg-green-500"}  flex items-center justify-center`}
          >
            <FontAwesomeIcon
              icon={faCheck}
              className="text-white text-[.8rem]"
            />
          </span>
          <p>Giới hạn 8-32 ký tự.</p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`w-6 h-6 rounded-full ${errInfoPass.special ? "bg-gray-300" : " bg-green-500"}  flex items-center justify-center`}
          >
            <FontAwesomeIcon
              icon={faCheck}
              className="text-white text-[.8rem]"
            />
          </span>
          <p>Tối thiểu 01 ký tự đặc biệt.</p>
        </div>
      </div>
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <span
            className={`w-6 h-6 rounded-full ${errInfoPass.uppercase ? "bg-gray-300" : " bg-green-500"}  flex items-center justify-center`}
          >
            <FontAwesomeIcon
              icon={faCheck}
              className="text-white text-[.8rem]"
            />
          </span>
          <p>Tối thiểu 01 ký tự IN HOA.</p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`w-6 h-6 rounded-full ${errInfoPass.number ? "bg-gray-300" : " bg-green-500"}  flex items-center justify-center`}
          >
            <FontAwesomeIcon
              icon={faCheck}
              className="text-white text-[.8rem]"
            />
          </span>
          <p>Tối thiểu 01 chữ số.</p>
        </div>
      </div>
    </div>
  );
}

export default ValidatePassword;
