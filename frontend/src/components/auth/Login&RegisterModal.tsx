import { faClose } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { motion } from "framer-motion";
import motorLogin from "../../assets/images/moto-login.png";
import faceLogo from "../../assets/images/facebook-logo.png";
import ggLogo from "../../assets/images/google-logo.png";
import React, { useState } from "react";
import axiosInstance from "../../configs/axiosInstance";
import { toast } from "react-toastify";
import { faEye, faEyeSlash } from "@fortawesome/free-regular-svg-icons";
import { useUser } from "../../hooks/useUser";
import { useAuth } from "../../hooks/useAuth";

interface LoginAndRegisterModalProp {
  onClose: () => void;
}

function LoginAndRegisterModal({ onClose }: LoginAndRegisterModalProp) {
  const [isLogin, setIsLogin] = useState(true);
  const [showPass, setShowPass] = useState(false);
  const [dataRequest, setDataRequest] = useState<{
    email: string;
    password: string;
  }>({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<{
    email: string;
    password: string;
  }>({
    email: "",
    password: "",
  });
  const { login } = useAuth();
  const { refetchUser } = useUser();

  const handleChangeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setDataRequest((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async () => {
    let isRequest = true;
    if (dataRequest.email === "") {
      setErrors((prev) => ({ ...prev, email: "Vui lòng nhập email của bạn!" }));
      isRequest = false;
    }
    if (dataRequest.password === "") {
      setErrors((prev) => ({
        ...prev,
        password: "Vui lòng nhập mật khẩu của bạn!",
      }));
      isRequest = false;
    }

    if (!isRequest) {
      return;
    }

    try {
      let res;
      if (isLogin) {
        res = await login(dataRequest);
      } else {
        res = await axiosInstance.post("/api/v1/auth/register", dataRequest);
      }

      if (res.status === 201) {
        refetchUser();
        toast.success(
          res.data.message ||
            (isLogin ? "Đăng nhập thành công!" : "Đăng kí thành công"),
        );
        onClose();
      }
    } catch (error) {
      const err = error as Error;
      toast.error(err.message || "Lỗi server! Vui lòng thử lại sau!");
    }
  };

  return (
    <div className="fixed inset-0 w-full h-full flex items-center justify-center bg-[#38383873]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        exit={{ opacity: 0, y: 20 }}
        className="relative w-[90%] md:w-[50rem] lg:w-[80rem] h-[50rem] lg:h-[60rem] flex bg-white shadow-xl rounded-xl"
      >
        <button
          className="absolute top-4 right-4 w-12 h-12 rounded-sm flex items-center justify-center bg-gray-100 hover:bg-gray-200 transition-colors duration-300 text-gray-500 hover:cursor-pointer"
          onClick={onClose}
        >
          <FontAwesomeIcon icon={faClose} />
        </button>
        <div className="relative hidden lg:block w-[35rem] h-full">
          <img
            src={motorLogin}
            alt="image motorcycle"
            className="w-full h-full object-cover rounded-tl-xl rounded-bl-xl"
          />
          <div className="absolute inset-0 w-full h-full bg-[#6464644a] flex items-end justify-start p-10 text-white font-medium">
            Tất cả các loại xe máy đều có ở đây!
          </div>
        </div>
        <div className="flex-1 p-[2rem]">
          <h3 className="text-[2.2rem] font-medium mb-8">
            {isLogin ? "Đăng nhập tài khoản" : "Đăng ký tài khoản"}
          </h3>
          <div className="space-y-6">
            <div>
              <label htmlFor="email" className="block mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={dataRequest.email}
                className="w-full h-[4.2rem] outline-none pl-6 border border-gray-300 rounded-xl"
                placeholder="Nhập email của bạn..."
                onChange={handleChangeInput}
              />
            </div>
            <p className="text-[1.4rem] text-red-500">{errors.email}</p>
            <div>
              <label htmlFor="" className="block mb-1">
                Mật khẩu
              </label>
              <div className="relative w-full h-[4.2rem]">
                <input
                  type={showPass ? "text" : "password"}
                  name="password"
                  value={dataRequest.password}
                  className="w-full h-full outline-none pl-6 border border-gray-300 rounded-xl"
                  placeholder="Nhập mật khẩu của bạn..."
                  onChange={handleChangeInput}
                />
                <button
                  className="absolute top-[50%] right-6 -translate-y-[50%] cursor-pointer"
                  onClick={() => setShowPass((prev) => !prev)}
                >
                  <FontAwesomeIcon icon={showPass ? faEye : faEyeSlash} />
                </button>
              </div>
              <p className="text-[1.4rem] text-red-500">{errors.password}</p>
            </div>
            {isLogin ? (
              <div className="flex items-center justify-end text-[1.4rem]">
                <p className="text-blue-500">Quên mật khẩu?</p>
              </div>
            ) : (
              <div className="text-[1.4rem] flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={true}
                  style={{ scale: "1.2" }}
                />
                <p>
                  Bạn đã đọc và <span className="text-blue-500">đồng ý</span>{" "}
                  với yêu cầu và{" "}
                  <span className="text-blue-500">
                    chính sách của chúng tôi!
                  </span>
                </p>
              </div>
            )}
            <button
              className="w-full h-[4.2rem] rounded-xl outline-none border-none bg-orange-600 hover:bg-orange-700 text-white transition-colors duration-300"
              onClick={handleSubmit}
            >
              {isLogin ? "Đăng nhập" : "Đăng ký"}
            </button>
            <div className="flex items-center gap-3">
              <span className="flex-1 block border-t border-t-gray-400"></span>
              <span className="block text-[1.4rem] whitespace-nowrap">
                Đăng {isLogin ? "nhập" : "ký"} nhanh bằng
              </span>
              <span className="flex-1 block border-t border-t-gray-400"></span>
            </div>
            <div className="flex items-center justify-center gap-10">
              <div className="w-14 h-14 rounded-full ">
                <img
                  src={ggLogo}
                  alt="Google Logo"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="w-14 h-14 rounded-full ">
                <img
                  src={faceLogo}
                  alt="FaceBook Logo"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <div className="flex items-center justify-center gap-1 text-[1.4rem]">
              <p>
                {isLogin
                  ? "Bạn chưa có tài khoản?"
                  : "Bạn đã có tài khoản?"}{" "}
              </p>
              <span
                className="text-blue-500 hover:cursor-pointer select-none"
                onClick={() => {
                  setDataRequest({
                    email: "",
                    password: "",
                  });
                  setIsLogin((prev) => !prev);
                }}
              >
                {isLogin ? "Đăng ký" : "Đăng nhập"}
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default LoginAndRegisterModal;
