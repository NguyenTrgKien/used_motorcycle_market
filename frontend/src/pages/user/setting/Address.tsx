import { faAdd, faEdit, faTrashCan } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { AnimatePresence } from "framer-motion";
import { useState } from "react";
import CreateAddress from "../../../components/CreateAddress";
import { useQuery } from "@tanstack/react-query";
import { getUserAddresses } from "../../../apis/address";
import type { UserAddressType } from "../../../types/address.type";

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

  const { data: dataUserAddresses, isLoading } = useQuery({
    queryKey: ["userAddresses"],
    queryFn: getUserAddresses,
  });
  const userAddresses = dataUserAddresses?.data || [];

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
                </div>
                <div className="flex flex-col gap-2 text-[1.4rem]">
                  <div className="flex items-center gap-2">
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
                    <button className="px-5 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors duration-300">
                      <FontAwesomeIcon icon={faTrashCan} />
                      Xóa
                    </button>
                  </div>
                  <button className="px-5 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors duration-300">
                    <FontAwesomeIcon icon={faTrashCan} />
                    Xóa
                  </button>
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
    </div>
  );
}

export default Address;
