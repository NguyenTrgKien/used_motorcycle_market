import { motion } from "framer-motion";
import { faCheck, faClose } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { UserAddressType } from "../types/address.type";
import { useUser } from "../hooks/useUser";
import { useState } from "react";

interface SelectAddressModalProps {
  onClose: () => void;
  setAddress: (address: UserAddressType) => void;
}

function SelectAddressModal({ setAddress, onClose }: SelectAddressModalProps) {
  const { user } = useUser();
  const [select, setSelect] = useState<UserAddressType | null>(() => {
    return user?.addresses.find((a: UserAddressType) => a.isDefault) || null;
  });
  const addresses = user?.addresses;

  const handleSelect = () => {
    if (select) {
      setAddress(select);
    }
    onClose();
    return;
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
          <h4 className="text-[2rem] font-medium w-full">Địa chỉ của bạn</h4>
          <button
            className="ml-auto w-12 h-12  rounded-sm flex items-center justify-center bg-gray-100 hover:bg-gray-200 transition-colors duration-300 text-gray-500 hover:cursor-pointer"
            onClick={onClose}
          >
            <FontAwesomeIcon icon={faClose} />
          </button>
        </div>
        <div className="space-y-5 p-10">
          {addresses.length > 0 ? (
            addresses?.map((address: UserAddressType) => {
              return (
                <div
                  key={address.id}
                  className={`relative p-5 rounded-lg border flex items-center justify-between ${select && select.id === address.id ? "border-green-500" : address.isDefault ? "border-green-500" : "border-gray-200"} hover:cursor-pointer transition-colors`}
                  onClick={() => setSelect(address)}
                >
                  <div>
                    <p className="text-gray-600">{address.address}</p>
                    <p className="text-gray-600 text-wrap max-w-lg">
                      {address.ward},{address.province},{address.district}
                    </p>
                  </div>
                  {address.isDefault && (
                    <div className="px-5 py-2 bg-cyan-100 text-[1.4rem] rounded-lg text-gray-600">
                      Mặt định
                    </div>
                  )}
                  {select && select.id === address.id && (
                    <div className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                      <FontAwesomeIcon
                        icon={faCheck}
                        className="text-[1.2rem] text-white"
                      />
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center">Không có địa chỉ</div>
          )}
        </div>
        <div className="flex justify-end border-t border-t-gray-200 px-10 py-5">
          <button
            className="px-10 py-3 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors duration-300 hover:cursor-pointer"
            type="button"
            onClick={handleSelect}
          >
            Chọn
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default SelectAddressModal;
