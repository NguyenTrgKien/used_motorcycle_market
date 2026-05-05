import { faClose, faLocationDot } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { motion } from "framer-motion";
import { useUser } from "../hooks/useUser";
import dayjs from "dayjs";
import {
  faCalendar,
  faCamera,
  faUser,
} from "@fortawesome/free-regular-svg-icons";
import type { UserAddressType } from "../types/address.type";
import { useState, type ChangeEvent } from "react";
import { toast } from "react-toastify";
import axiosInstance from "../configs/axiosInstance";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface ChangeAvatarModalProps {
  onClose: () => void;
}

function ChangeAvatarModal({ onClose }: ChangeAvatarModalProps) {
  const { user } = useUser();
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarUrl, setAvatarUrl] = useState("");
  const address =
    user?.addresses?.find((it: UserAddressType) => it.isDefault) ||
    user.addresses[0];
  const queryClient = useQueryClient();
  const handleChangeAvatar = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target?.files?.[0];
    let url = "";
    if (file) {
      url = URL.createObjectURL(file);
      setAvatar(file);
    }
    setAvatarUrl(url);
  };

  const submitMutation = useMutation({
    mutationFn: async (formData: FormData) =>
      await axiosInstance.patch(`/api/v1/users/${user.id}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }),
    onSuccess: (res) => {
      toast.success(res.data.message || "Đã có lỗi xãy ra!");
      queryClient.invalidateQueries({ queryKey: ["user"] });
      onClose();
    },
    onError: async (err: any) => {
      toast.error(err?.response?.data.message || "Đã có lỗi xãy ra!");
    },
  });

  const handleSubmit = async () => {
    if (!avatar) {
      return;
    }
    const formData = new FormData();
    formData.append("avatar", avatar);
    await submitMutation.mutateAsync(formData);
  };

  return (
    <div className="fixed inset-0 w-full h-full flex items-center justify-center bg-[#38383873] z-[100]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        exit={{ opacity: 0, y: 20 }}
        className="w-[90%] md:w-[50rem] lg:w-[50rem] h-auto bg-white shadow-xl rounded-2xl"
      >
        <div className="w-full flex relative border-b border-b-gray-200 pb-5 rounded-tl-2xl rounded-tr-2xl p-5">
          <h4 className="text-[2rem] font-medium w-full">Thông tin hình ảnh</h4>
          <button
            className="ml-auto w-12 h-12  rounded-sm flex items-center justify-center bg-gray-100 hover:bg-gray-200 transition-colors duration-300 text-gray-500 hover:cursor-pointer"
            onClick={onClose}
          >
            <FontAwesomeIcon icon={faClose} />
          </button>
        </div>
        <div className="p-10">
          <div className="flex items-start gap-5">
            <div className="w-40 h-40 relative">
              {avatarUrl || user.avatar ? (
                <img
                  src={avatarUrl || user.avatar}
                  referrerPolicy="no-referrer"
                  alt={`avatar-${user.fullName}`}
                  className="w-full h-full rounded-full object-cover border border-gray-200"
                />
              ) : (
                <div className="w-full h-full rounded-full flex items-center justify-center bg-cyan-200 text-blue-800 font-semibold  mx-auto">
                  NT
                </div>
              )}
              <label className="absolute bottom-0 right-0 w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center hover:cursor-pointer">
                <FontAwesomeIcon icon={faCamera} className="text-[1.4rem]" />
                <input
                  type="file"
                  id="avatar"
                  name="avatar"
                  hidden
                  onChange={handleChangeAvatar}
                />
              </label>
            </div>
            <div className="space-y-2 flex-1">
              <p className="text-[2rem]">{user.fullName}</p>
              <p className="text-[1.4rem] text-gray-600">
                <FontAwesomeIcon icon={faUser} className="pr-3" />
                Người theo dõi: 0
              </p>
              <p className="text-[1.4rem] text-gray-600">
                <FontAwesomeIcon icon={faCalendar} className="pr-3" />
                Đã tham gia: {dayjs(user.createdAt).format("DD/MM/YYYY")}
              </p>
              <p className="text-[1.4rem] text-gray-600">
                <FontAwesomeIcon icon={faLocationDot} className="pr-3" />
                {address
                  ? `${address.address}, ${address.ward}, ${address.district}, ${address.province}`
                  : "Chưa cung cấp"}
              </p>
            </div>
          </div>
        </div>
        <div className="flex justify-end border-t border-t-gray-200 px-10 py-5">
          <button
            className="px-10 py-3 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors duration-300 hover:cursor-pointer"
            onClick={handleSubmit}
            disabled={submitMutation.isPending}
          >
            {submitMutation.isPending ? "Đang xử lý..." : "Lưu"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default ChangeAvatarModal;
