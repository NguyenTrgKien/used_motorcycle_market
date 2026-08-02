import { useQuery } from "@tanstack/react-query";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheck,
  faLocationDot,
  faMagnifyingGlass,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import Select from "react-select";
import { getAddresses } from "../apis/address.api";
import { useLocationSelection } from "../contexts/LocationContext";
import { useUser } from "../hooks/useUser";
import type { UserAddressType } from "../types/address.type";
import HCM from "../assets/images/HCM.jpg";
import HaNoi from "../assets/images/HaNoi.jpg";
import CanTho from "../assets/images/CanTho.jpg";

interface AddressProvince {
  name: string;
}

interface ProvinceOption {
  value: string;
  label: string;
}

const popularLocations = [
  {
    value: "Thành phố Hồ Chí Minh",
    label: "TP. Hồ Chí Minh",
    image: HCM,
  },
  {
    value: "Thành phố Hà Nội",
    label: "TP. Hà Nội",
    image: HaNoi,
  },
  {
    value: "Thành phố Cần Thơ",
    label: "TP. Cần Thơ",
    image: CanTho,
  },
];

function LocationSearchModal() {
  const { location, setLocation } = useLocationSelection();
  const { user, isLoading: isLoadingUser } = useUser();
  const [isDismissed, setIsDismissed] = useState(false);
  const [province, setProvince] = useState("");
  const { data: addresses = [], isLoading } = useQuery<AddressProvince[]>({
    queryKey: ["addresses"],
    queryFn: getAddresses,
    staleTime: 24 * 60 * 60 * 1000,
  });

  const provinceOptions = useMemo(
    () =>
      addresses.map((item) => ({
        value: item.name,
        label: item.name,
      })),
    [addresses],
  );

  const hasUserAddress = Boolean(
    user?.addresses?.some((address: UserAddressType) => address.province),
  );
  const isOpen = !location && !isDismissed && !isLoadingUser && !hasUserAddress;

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsDismissed(true);
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleApply = () => {
    if (!province) return;
    setLocation({ province, district: "" });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[1000] flex items-center justify-center overflow-y-auto bg-gray-950/55 px-4 py-4 backdrop-blur-[2px]"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setIsDismissed(true);
          }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="location-search-modal-title"
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-[56rem] overflow-hidden rounded-3xl bg-white shadow-2xl"
          >
            <div className="flex items-center gap-5 px-7 py-8 border-b border-b-gray-300">
              <button
                type="button"
                aria-label="Đóng"
                onClick={() => setIsDismissed(true)}
                className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full bg-white/20 transition-colors hover:bg-white/30"
              >
                <FontAwesomeIcon icon={faXmark} />
              </button>
              <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-xl bg-amber-100 text-amber-600 text-[2.4rem]">
                <FontAwesomeIcon icon={faLocationDot} />
              </div>
              <div>
                <h2
                  id="location-search-modal-title"
                  className="pr-10 font-bold leading-tight text-[2.2rem]"
                >
                  Bạn muốn tìm xe ở đâu?
                </h2>
                <p className="mt-2 text-[1.4rem] sm:text-[1.5rem]">
                  Chọn tỉnh hoặc thành phố để xem những chiếc xe phù hợp gần
                  bạn.
                </p>
              </div>
            </div>

            <div className="grid w-full grid-cols-1 gap-4 px-7 pt-6 sm:grid-cols-3 sm:px-10">
              {popularLocations.map((item) => {
                const isSelected = province === item.value;

                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setProvince(item.value)}
                    className={`overflow-hidden rounded-xl border-2 bg-white text-center transition-all ${
                      isSelected
                        ? "border-amber-500 shadow-md"
                        : "border-transparent hover:border-amber-200 hover:shadow"
                    }`}
                  >
                    <span className="relative block h-[10rem] w-full sm:h-[12rem]">
                      <img
                        src={item.image}
                        alt={item.label}
                        className="h-full w-full object-cover"
                      />
                      {isSelected && (
                        <span className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-amber-500 text-white shadow-md">
                          <FontAwesomeIcon
                            icon={faCheck}
                            className="text-[1.2rem]"
                          />
                        </span>
                      )}
                    </span>
                    <span
                      className={`block px-2 py-3 font-medium ${
                        isSelected ? "text-amber-600" : "text-gray-700"
                      }`}
                    >
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="space-y-6 px-7 py-10 sm:px-10 sm:py-10">
              <div>
                <label
                  htmlFor="global-location-province"
                  className="mb-2 block font-semibold text-gray-800"
                >
                  Tỉnh / Thành phố
                </label>
                <Select<ProvinceOption>
                  inputId="global-location-province"
                  options={provinceOptions}
                  value={
                    provinceOptions.find(
                      (option) => option.value === province,
                    ) || null
                  }
                  isLoading={isLoading}
                  isDisabled={isLoading}
                  isSearchable
                  menuPortalTarget={document.body}
                  menuPosition="fixed"
                  menuShouldScrollIntoView={false}
                  placeholder="Nhập tên tỉnh, thành phố"
                  noOptionsMessage={() => "Không tìm thấy tỉnh, thành phố"}
                  onChange={(option) => setProvince(option?.value || "")}
                  styles={{
                    control: (base) => ({
                      ...base,
                      minHeight: "5rem",
                      borderRadius: "1.2rem",
                      fontSize: "1.6rem",
                      paddingLeft: "0.4rem",
                    }),
                    menu: (base) => ({
                      ...base,
                      fontSize: "1.6rem",
                    }),
                    menuPortal: (base) => ({
                      ...base,
                      zIndex: 1200,
                    }),
                    option: (base, state) => ({
                      ...base,
                      backgroundColor: state.isSelected
                        ? "#f97316"
                        : state.isFocused
                          ? "#fff7ed"
                          : "white",
                      color: state.isSelected ? "white" : "#374151",
                    }),
                  }}
                />
              </div>

              <button
                type="button"
                disabled={!province}
                onClick={handleApply}
                className="flex h-[5rem] w-full items-center justify-center gap-2 rounded-xl bg-amber-500 font-semibold text-white transition-colors hover:bg-amber-600 disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                <FontAwesomeIcon icon={faMagnifyingGlass} />
                Tìm xe tại khu vực này
              </button>

              <button
                type="button"
                onClick={() => setIsDismissed(true)}
                className="w-full text-center text-[1.4rem] text-gray-500 transition-colors hover:text-gray-700 hover:cursor-pointer"
              >
                Để sau
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default LocationSearchModal;
