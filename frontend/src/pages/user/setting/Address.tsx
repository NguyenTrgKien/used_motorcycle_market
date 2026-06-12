import { faAdd, faEdit, faTrashCan } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { AnimatePresence } from "framer-motion";
import { useState } from "react";
import CreateAddress from "../../../components/CreateAddress";
import { useMutation, useQuery } from "@tanstack/react-query";
import { getUserAddresses } from "../../../apis/address.api";
import type { UserAddressType } from "../../../types/address.type";
import { motion } from "framer-motion";
import BottomBtn from "../../../components/BottomBtn";
import axiosInstance from "../../../configs/axiosInstance";
import { toast } from "react-toastify";

function Address() {
  const [showAction, setShowAction] = useState<{
    open: boolean;
    action: "" | "create" | "edit";
    dataUpdate: null | UserAddressType;
  }>({
    open: false,
    action: "",
    dataUpdate: null,
  });
  const [showDelete, setShowDelete] = useState<number | null>(null);
  const {
    data: dataUserAddresses,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["userAddresses"],
    queryFn: getUserAddresses,
  });
  const userAddresses = dataUserAddresses?.data || [];

  const deleteMutation = useMutation({
    mutationFn: async () =>
      await axiosInstance.delete(`/api/v1/user-addresses/${showDelete}`),
    onSuccess: async (res) => {
      toast.success(res?.data?.message);
      await refetch();
      setShowDelete(null);
    },
    onError: async (error: any) => {
      toast.error(
        error.response?.data?.message || "Đã có lỗi xảy ra. Vui lòng thử lại!",
      );
    },
  });

  const handleDelete = async () => {
    await deleteMutation.mutate();
  };

  return (
    <div className="p-[2rem]">
      <div className="mb-8 w-full flex items-center justify-between">
        <h4 className="text-[2rem] font-medium ">Địa chỉ</h4>
        <button
          className="px-6 py-3 rounded-xl bg-blue-500 text-white hover:bg-blue-600 transition-colors duration-300 hover:cursor-pointer"
          onClick={() =>
            setShowAction({ open: true, action: "create", dataUpdate: null })
          }
        >
          <FontAwesomeIcon icon={faAdd} />
          <span>Thêm địa chỉ</span>
        </button>
      </div>
      <div className="space-y-6">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-8 border border-gray-300 rounded-xl animate-pulse"
            >
              <div className="space-y-3">
                <div className="h-4 w-64 bg-gray-300 rounded"></div>
                <div className="h-4 w-48 bg-gray-300 rounded"></div>
              </div>

              <div className="flex flex-col gap-2">
                <div className="h-10 w-28 bg-gray-300 rounded-lg"></div>
                <div className="h-10 w-28 bg-gray-300 rounded-lg"></div>
              </div>
            </div>
          ))
        ) : userAddresses.length > 0 ? (
          userAddresses.map((address: UserAddressType) => {
            return (
              <div
                key={address.id}
                className="flex items-center justify-between p-8 border border-gray-200 rounded-xl"
              >
                <div className="text-gray-500">
                  <p>{address.address},</p>
                  <p>
                    {address.ward}, {address.district}, {address.province}
                  </p>
                  <div className="flex">
                    <span className="text-cyan-500 text-[1.4rem] px-5 py-1 rounded-full bg-cyan-50 mt-2 block">
                      Mặc định
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-4 text-[1.4rem]">
                  <div className="flex items-center gap-4">
                    <button
                      className="px-5 py-2 rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition-colors duration-300"
                      onClick={() =>
                        setShowAction({
                          open: true,
                          action: "edit",
                          dataUpdate: address,
                        })
                      }
                    >
                      <FontAwesomeIcon icon={faEdit} />
                      Chỉnh sửa
                    </button>
                    <button
                      className="px-5 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors duration-300 hover"
                      onClick={() => setShowDelete(address.id)}
                    >
                      <FontAwesomeIcon icon={faTrashCan} />
                      Xóa
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-gray-500 w-full py-25 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-center">
            Không có địa chỉ
          </div>
        )}
      </div>

      <AnimatePresence>
        {showAction.open && (
          <CreateAddress
            action={showAction.action}
            dataUpdate={showAction.dataUpdate}
            onClose={() =>
              setShowAction({ open: false, action: "", dataUpdate: null })
            }
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDelete && (
          <div className="fixed inset-0 w-full h-full flex items-center justify-center bg-[#38383873] z-[100]">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              exit={{ opacity: 0, y: 20 }}
              className="w-[90%] md:w-[50rem] lg:w-[50rem] p-10 h-auto bg-white shadow-xl rounded-2xl"
            >
              <h4 className="text-[1.8rem] font-medium w-full">
                Bạn có chắc muốn xóa địa chỉ này?
              </h4>
              <BottomBtn
                btnLeftTitle="Hủy"
                btnRightTitle="Xóa"
                handleCancel={() => setShowDelete(null)}
                handleSubmit={handleDelete}
                isLoading={deleteMutation.isPending}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Address;
