import { faClose } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { motion } from "framer-motion";
import motorLogin from "../../assets/images/moto-login.png";
import faceLogo from "../../assets/images/facebook-logo.png";
import ggLogo from "../../assets/images/google-logo.png";
import React, { useEffect, useState } from "react";
import axiosInstance from "../../configs/axiosInstance";
import { toast } from "react-toastify";
import { faEye, faEyeSlash } from "@fortawesome/free-regular-svg-icons";
import { useUser } from "../../hooks/useUser";
import { useQueryClient } from "@tanstack/react-query";
import ForgotPass from "./ForgotPass";

interface LoginAndRegisterModalProp {
  onClose: () => void;
}

type Step = "form" | "otp" | "forgot";

function LoginAndRegisterModal({ onClose }: LoginAndRegisterModalProp) {
  const queryClient = useQueryClient();
  const [isLogin, setIsLogin] = useState(true);
  const [showPass, setShowPass] = useState(false);
  const [step, setStep] = useState<Step>("form");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResendOtp, setIsResendOtp] = useState(false);
  const startCountdown = () => {
    localStorage.setItem("otp_resend_time", Date.now().toString());
  };
  const getRemainingTime = () => {
    const sentAt = localStorage.getItem("otp_resend_time");
    if (!sentAt) return 0;
    const elapsed = Math.floor((Date.now() - Number(sentAt)) / 1000);
    return Math.max(0, 60 - elapsed);
  };
  const [countDown, setCountDown] = useState(() => getRemainingTime());
  const [canResend, setCanResend] = useState(() => getRemainingTime() === 0);
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
  const [errorOtp, setErrorOtp] = useState("");
  const [errMessage, setErrMessage] = useState("");
  const { refetchUser } = useUser();

  useEffect(() => {
    if (countDown <= 0) {
      setCanResend(true);
      return;
    }

    const timer = setTimeout(() => {
      setCountDown((prev) => prev - 1);
    }, 1000);

    return () => {
      clearTimeout(timer);
    };
  }, [countDown]);

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
      setIsLoading(true);
      let res;
      if (isLogin) {
        res = await axiosInstance.post("/api/v1/auth/login", dataRequest);
        if (res.status === 201) {
          refetchUser();
          toast.success("Đăng nhập thành công!");
          queryClient.invalidateQueries({ queryKey: ["user"] });
          onClose();
        }
      } else {
        res = await axiosInstance.post("/api/v1/auth/register", dataRequest);
        console.log(res);
        if (res.status === 201) {
          setStep("otp");
          startCountdown();
          toast.info("Mã OTP đã được gửi về email của bạn!");
        }
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.log(error);
      setErrMessage(
        error?.response?.data.message || "Lỗi server! Vui lòng thử lại sau!",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    try {
      if (!otp) {
        setErrorOtp("Vui lòng nhập mã otp!");
        return;
      }
      setIsLoading(true);
      const res = await axiosInstance.post("/api/v1/auth/verify-email", {
        email: dataRequest.email,
        otp,
      });
      if (res.status === 201) {
        refetchUser();
        toast.success("Xác thực tài khoản thành công!");
        onClose();
      }
    } catch {
      toast.error("OTP không đúng hoặc đã hết hạn!");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      if (!canResend) return;
      setIsResendOtp(true);
      await axiosInstance.get("/api/v1/auth/resend-otp", {
        params: {
          email: dataRequest.email,
        },
      });
      startCountdown();
      setCountDown(60);
      setCanResend(false);
    } catch (error) {
      console.log(error);
      toast.error("Gưi lại otp thất bại!");
    } finally {
      setIsResendOtp(false);
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
        {step === "otp" ? (
          <div className="flex-1 p-[2rem]">
            <h3 className="text-[2.2rem] font-medium mb-8">Nhập mã OTP</h3>
            <p className="text-gray-500 text-[1.4rem]">
              Mã OTP đã được gửi đến <strong>{dataRequest.email}</strong>
            </p>
            <input
              type="number"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full h-[4.2rem] outline-none pl-6 border border-gray-300 rounded-xl tracking-widest text-center text-2xl"
              placeholder="_ _ _ _ _ _"
            />
            <p className="text-[1.4rem] text-red-500 mt-1">{errorOtp}</p>
            <button
              type="button"
              disabled={isLoading}
              onClick={handleVerifyOtp}
              className="w-full mt-5 h-[4.2rem] flex items-center justify-center bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors duration-300 cursor-pointer"
            >
              {isLoading ? "Đang xử lý..." : "Xác nhận OTP"}
            </button>
            <p className="text-[1.4rem] text-center mt-5 flex items-center justify-center gap-2">
              Không nhận được mã?{" "}
              {canResend ? (
                <span
                  className="text-blue-500 cursor-pointer"
                  onClick={handleResendOtp}
                >
                  {isResendOtp ? (
                    <span className="inline-block w-6 h-6 mt-1 rounded-full border-t border-t-blue-600 border-b border-b-blue-600 animate-spin"></span>
                  ) : (
                    "Gửi lại"
                  )}
                </span>
              ) : (
                <span className="text-gray-500">
                  Gửi lại sau <strong>{countDown}s</strong>
                </span>
              )}
            </p>
          </div>
        ) : step === "forgot" ? (
          // <div className="flex-1 p-[2rem]">
          //   <h3 className="text-[2.2rem] font-medium mb-8">Quên mật khẩu</h3>
          //   <p className="text-gray-500 text-[1.4rem] w-full py-2 px-5 rounded-xl mb-5 bg-blue-100">
          //     Nhập email để nhận mã otp
          //   </p>
          //   <label className="text-gray-500">Email</label>
          //   <input
          //     type="email"
          //     value={otp}
          //     onChange={(e) => setOtp(e.target.value)}
          //     className="w-full h-[4.2rem] outline-none mt-2 pl-6 border border-gray-300 rounded-xl"
          //     placeholder="Nhập email của bạn..."
          //   />
          //   <p className="text-[1.4rem] text-red-500 mt-1">{errorOtp}</p>
          //   <button
          //     type="button"
          //     disabled={isLoading}
          //     onClick={handleVerifyOtp}
          //     className="w-full mt-5 h-[4.2rem] flex items-center justify-center bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors duration-300 cursor-pointer"
          //   >
          //     {isLoading ? "Đang xử lý..." : "Gửi mã xác nhận"}
          //   </button>
          //   <p className="text-[1.4rem] text-center mt-5 flex items-center justify-center gap-2">
          //     Bạn nhớ mật khẩu?{" "}
          //     <span
          //       className="text-blue-600 cursor-pointer"
          //       onClick={() => setStep("form")}
          //     >
          //       Đăng nhập
          //     </span>
          //   </p>
          // </div>
          <ForgotPass setStep={setStep} />
        ) : (
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
                  onFocus={() => setErrors((prev) => ({ ...prev, email: "" }))}
                />
                <p className="text-[1.4rem] text-red-500 mt-2">
                  {errors.email}
                </p>
              </div>
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
                    onFocus={() =>
                      setErrors((prev) => ({ ...prev, password: "" }))
                    }
                  />
                  <button
                    className="absolute top-[50%] right-6 -translate-y-[50%] cursor-pointer"
                    onClick={() => setShowPass((prev) => !prev)}
                  >
                    <FontAwesomeIcon icon={showPass ? faEye : faEyeSlash} />
                  </button>
                </div>
                <p className="text-[1.4rem] text-red-500 mt-2">
                  {errors.password}
                </p>
              </div>
              {isLogin ? (
                <div className="flex items-center justify-end text-[1.4rem]">
                  <p
                    className="text-blue-500 cursor-pointer"
                    onClick={() => setStep("forgot")}
                  >
                    Quên mật khẩu?
                  </p>
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
              <p className="text-[1.4rem] text-red-500 mt-2">{errMessage}</p>
              <button
                type="button"
                className="w-full h-[4.2rem] rounded-xl outline-none border-none bg-orange-600 hover:bg-orange-700 text-white transition-colors duration-300"
                onClick={handleSubmit}
                disabled={isLoading}
              >
                {isLoading
                  ? "Đang xử lý..."
                  : isLogin
                    ? "Đăng nhập"
                    : "Đăng ký"}
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
        )}
      </motion.div>
    </div>
  );
}

export default LoginAndRegisterModal;
