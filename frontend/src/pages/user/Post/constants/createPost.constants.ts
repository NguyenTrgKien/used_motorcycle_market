export const bodyTypeOptions = [
  { value: "motorbike", label: "Xe máy" },
  { value: "motorcycle", label: "Mô tô" },
  { value: "scooter", label: "Xe tay ga" },
  { value: "car", label: "Ô tô" },
  { value: "truck", label: "Xe tải" },
  { value: "dump_truck", label: "Xe ben" },
  { value: "van", label: "Xe van" },
  { value: "bus", label: "Xe khách" },
  { value: "special_purpose", label: "Xe chuyên dụng" },
  { value: "other", label: "Khác" },
];

export const fuelTypeOptions = [
  { value: "gasoline", label: "Xăng" },
  { value: "diesel", label: "Dầu diesel" },
  { value: "electric", label: "Điện" },
  { value: "hybrid", label: "Hybrid" },
  { value: "plug_in_hybrid", label: "Plug-in hybrid" },
  { value: "other", label: "Khác" },
];

export const transmissionOptions = [
  { value: "manual", label: "Số sàn" },
  { value: "automatic", label: "Tự động" },
  { value: "semi_automatic", label: "Bán tự động" },
  { value: "cvt", label: "CVT" },
  { value: "single_speed", label: "Một cấp" },
  { value: "other", label: "Khác" },
];

export const conditionOptions = [
  { value: "used", label: "Đã sử dụng" },
  { value: "new", label: "Mới" },
  { value: "excellent", label: "Rất tốt" },
  { value: "good", label: "Tốt" },
  { value: "fair", label: "Trung bình" },
];

export const initialForm = {
  categoryId: "",
  title: "",
  description: "",
  price: "",
  province: "",
  district: "",
  ward: "",
  addressDetail: "",
  brandName: "",
  modelName: "",
  bodyType: "",
  manufactureYear: "",
  registrationYear: "",
  mileage: "",
  color: "",
  condition: "used",
  engineCapacity: "",
  enginePower: "",
  batteryCapacity: "",
  rangePerCharge: "",
  licensePlate: "",
  fuelType: "gasoline",
  transmission: "automatic",
  origin: "",
  documentsStatus: "",
  seatCount: "",
  doorCount: "",
  payloadKg: "",
  grossWeightKg: "",
  wheelCount: "",
};

export const selectStyles = {
  control: (base: any) => ({
    ...base,
    minHeight: "4.6rem",
    borderRadius: "1.2rem",
    borderColor: "#d1d5db",
    boxShadow: "none",
    fontSize: "1.4rem",
    "&:hover": {
      borderColor: "#f59e0b",
    },
  }),
  valueContainer: (base: any) => ({
    ...base,
    padding: "0 1.6rem",
  }),
  placeholder: (base: any) => ({
    ...base,
    color: "#9ca3af",
  }),
  menu: (base: any) => ({
    ...base,
    zIndex: 20,
    fontSize: "1.4rem",
  }),
};
