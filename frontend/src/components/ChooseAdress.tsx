import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import Select from "react-select";
import { getAddresses } from "../apis/address.api";
import { useLocationSelection } from "../contexts/LocationContext";

interface AddressDistrict {
  name: string;
}

interface AddressProvince {
  name: string;
  districts: AddressDistrict[];
}

interface SelectOption {
  value: string;
  label: string;
}

const defaultLocations = [
  { value: "Thành phố Hồ Chí Minh", label: "TP. Hồ Chí Minh" },
  { value: "Thành phố Hà Nội", label: "TP. Hà Nội" },
  { value: "Thành phố Cần Thơ", label: "TP. Cần Thơ" },
];

function ChooseAddress({ onClose }: { onClose: () => void }) {
  const { location, setLocation } = useLocationSelection();
  const [province, setProvince] = useState(location?.province || "");
  const [district, setDistrict] = useState(location?.district || "");
  const { data: addresses = [], isLoading } = useQuery<AddressProvince[]>({
    queryKey: ["addresses"],
    queryFn: getAddresses,
    staleTime: 24 * 60 * 60 * 1000,
  });
  const districts = useMemo(
    () => addresses.find((item) => item.name === province)?.districts || [],
    [addresses, province],
  );
  const provinceOptions = useMemo(
    () =>
      addresses.map((item) => ({
        value: item.name,
        label: item.name,
      })),
    [addresses],
  );
  const districtOptions = useMemo(
    () => [
      { value: "", label: "Tất cả quận/huyện" },
      ...districts.map((item) => ({
        value: item.name,
        label: item.name,
      })),
    ],
    [districts],
  );
  const selectStyles = {
    control: (base: Record<string, unknown>) => ({
      ...base,
      minHeight: "4.6rem",
      borderColor: "#d1d5db",
      boxShadow: "none",
      fontSize: "1.6rem",
    }),
    menu: (base: Record<string, unknown>) => ({
      ...base,
      zIndex: 1000,
      fontSize: "1.6rem",
    }),
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProvince(location?.province || "");
    setDistrict(location?.district || "");
  }, [location]);

  const handleApply = () => {
    if (!province) return;
    setLocation({ province, district });
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      exit={{ opacity: 0, y: -8 }}
      className="absolute left-0 top-[calc(100%+1rem)] z-[999] w-[40rem] space-y-5 rounded-xl border border-gray-200 bg-white p-5 text-left text-gray-700 shadow-xl"
    >
      <div>
        <p className="font-semibold text-gray-900">Chọn khu vực</p>
        <p className="mt-1 text-[1.4rem] text-gray-500">
          Tin đăng sẽ được lọc theo vị trí này
        </p>
      </div>
      <div>
        <p className="mb-2 text-[1.3rem] font-medium text-gray-600">
          Khu vực phổ biến
        </p>
        <div className="flex flex-wrap gap-2">
          {defaultLocations.map((item) => {
            const isSelected = province === item.value;

            return (
              <button
                key={item.value}
                type="button"
                onClick={() => {
                  setProvince(item.value);
                  setDistrict("");
                }}
                className={`rounded-full border px-4 py-2 text-[1.3rem] font-medium transition-colors ${
                  isSelected
                    ? "border-amber-500 bg-amber-50 text-amber-600"
                    : "border-gray-200 bg-white text-gray-600 hover:border-amber-300 hover:text-amber-600"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
      <Select<SelectOption>
        inputId="header-location-province"
        options={provinceOptions}
        value={provinceOptions.find((item) => item.value === province) || null}
        isDisabled={isLoading}
        isLoading={isLoading}
        isSearchable
        isClearable
        placeholder="Tìm tỉnh/thành phố"
        noOptionsMessage={() => "Không tìm thấy tỉnh/thành phố"}
        onChange={(option) => {
          setProvince(option?.value || "");
          setDistrict("");
        }}
        styles={selectStyles}
      />
      <Select<SelectOption>
        inputId="header-location-district"
        options={districtOptions}
        value={
          districtOptions.find((item) => item.value === district) ||
          districtOptions[0]
        }
        isDisabled={!province}
        isSearchable
        placeholder="Tìm quận/huyện"
        noOptionsMessage={() => "Không tìm thấy quận/huyện"}
        onChange={(option) => setDistrict(option?.value || "")}
        styles={selectStyles}
      />
      <button
        type="button"
        disabled={!province}
        onClick={handleApply}
        className="h-[4rem] w-full rounded-md bg-amber-500 text-white transition-colors hover:bg-amber-600 disabled:cursor-not-allowed disabled:bg-gray-300"
      >
        Áp dụng
      </button>
    </motion.div>
  );
}

export default ChooseAddress;
