import { faCircleCheck } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

type ChangeContactType = "email" | "phone" | "add_phone" | "";

interface SuccessStepProps {
  type: ChangeContactType;
  value: string;
  onClose: () => void;
}

function SuccessStep({ type, value, onClose }: SuccessStepProps) {
  const isEmail = type === "email";

  return (
    <div className="flex flex-col items-center justify-center p-10 text-center">
      <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-6">
        <FontAwesomeIcon
          icon={faCircleCheck}
          className="text-green-500 text-[3.6rem]"
        />
      </div>

      <h3 className="text-[2.2rem] font-semibold text-gray-900">
        {isEmail
          ? "Đổi email thành công!"
          : type === "add_phone"
            ? "Liên kết số điện thoại thành công!"
            : "Đổi số điện thoại thành công!"}
      </h3>

      <p className="text-gray-500 mt-3 leading-relaxed">
        {isEmail
          ? "Email tài khoản của bạn đã được cập nhật thành"
          : type === "add_phone"
            ? "Số điện thoại của bạn đã được liên kết với tài khoản thành công"
            : "Số điện thoại tài khoản của bạn đã được cập nhật thành"}
      </p>

      <p className="text-amber-600 font-medium text-[1.6rem] mt-1">
        {type !== "add_phone" && value}
      </p>

      <button
        onClick={onClose}
        className="mt-10 w-full h-[4.8rem] rounded-xl bg-amber-500 hover:bg-amber-600 transition-colors duration-300 text-white font-medium hover:cursor-pointer"
      >
        Hoàn tất
      </button>
    </div>
  );
}

export default SuccessStep;
