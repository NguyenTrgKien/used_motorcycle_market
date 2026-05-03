import { faAdd } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { AnimatePresence } from "framer-motion";
import { useState } from "react";
import CreateAddress from "../../../components/CreateAddress";
import { useQuery } from "@tanstack/react-query";
import { getUserAddresses } from "../../../apis/address";
import type { UserAddressType } from "../../../types/address.type";

function Address() {
  const [showAction, setShowAction] = useState({
    open: false,
    action: "",
    dataUpdate: null,
  });

  const { data: dataUserAddresses, isLoading } = useQuery({
    queryKey: ["userAddresses"],
    queryFn: getUserAddresses,
  });
  const userAddresses = dataUserAddresses?.data || [];
  console.log(dataUserAddresses);

  return (
    <div className="p-[2rem]">
      <div className="mb-8 w-full flex items-center justify-between">
        <h4 className="text-[2rem] font-medium ">Địa chỉ</h4>
        <button
          className="px-6 py-3 rounded-xl bg-amber-500 text-white hover:bg-amber-600 transition-colors duration-300 hover:cursor-pointer"
          onClick={() =>
            setShowAction({ open: true, action: "create", dataUpdate: null })
          }
        >
          <FontAwesomeIcon icon={faAdd} />
          <span>Thêm địa chỉ</span>
        </button>
      </div>
      {isLoading ? (
        <div></div>
      ) : userAddresses.length > 0 ? (
        userAddresses.map((address: UserAddressType) => {
          return <div key={address.id}></div>;
        })
      ) : (
        <div className="text-gray-500 w-full py-25 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-center">
          Không có địa chỉ
        </div>
      )}

      <AnimatePresence>
        {showAction.open && (
          <CreateAddress
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
